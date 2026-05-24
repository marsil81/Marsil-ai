const express = require('express');
const fetch = require('node-fetch');

class AnthropicProxy {
    constructor() {
        this.app = express();
        this.app.use(express.json({ limit: '50mb' }));
        this.targetBaseUrl = 'https://api.deepseek.com';
        this.targetApiKey = '';
        this.targetModel = 'deepseek-chat';

        this.setupRoutes();
    }

    setTarget(baseUrl, apiKey, model) {
        if (baseUrl) this.targetBaseUrl = baseUrl;
        if (apiKey) this.targetApiKey = apiKey;
        if (model) this.targetModel = model;
    }

    setupRoutes() {
        this.app.post('/v1/messages', async (req, res) => {
            try {
                const anthropicReq = req.body;
                
                // 1. Translate Messages
                const openaiMessages = [];
                if (anthropicReq.system) {
                    let sysText = anthropicReq.system;
                    if (Array.isArray(sysText)) sysText = sysText.map(s => s.text).join('\n');
                    openaiMessages.push({ role: 'system', content: sysText });
                }

                for (const msg of anthropicReq.messages) {
                    let content = msg.content;
                    if (Array.isArray(content)) {
                        // Handle text and tool_use / tool_result
                        let textParts = [];
                        let toolCalls = [];
                        
                        for (const part of content) {
                            if (part.type === 'text') textParts.push(part.text);
                            if (part.type === 'tool_use') {
                                toolCalls.push({
                                    id: part.id,
                                    type: 'function',
                                    function: { name: part.name, arguments: JSON.stringify(part.input) }
                                });
                            }
                            if (part.type === 'tool_result') {
                                openaiMessages.push({
                                    role: 'tool',
                                    tool_call_id: part.tool_use_id,
                                    content: typeof part.content === 'string' ? part.content : JSON.stringify(part.content)
                                });
                            }
                        }
                        
                        if (msg.role === 'assistant' && toolCalls.length > 0) {
                            openaiMessages.push({
                                role: 'assistant',
                                content: textParts.join('\n') || null,
                                tool_calls: toolCalls
                            });
                        } else if (textParts.length > 0) {
                            openaiMessages.push({ role: msg.role, content: textParts.join('\n') });
                        }
                    } else {
                        openaiMessages.push({ role: msg.role, content: String(content) });
                    }
                }

                // 2. Translate Tools
                const openaiTools = anthropicReq.tools?.map(t => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: t.input_schema
                    }
                })) || undefined;

                // 3. Make Request to OpenAI / DeepSeek
                const openaiReq = {
                    model: this.targetModel,
                    messages: openaiMessages,
                    tools: openaiTools,
                    stream: anthropicReq.stream,
                    temperature: anthropicReq.temperature || 0.7,
                    max_tokens: anthropicReq.max_tokens || 4000
                };

                const response = await fetch(`${this.targetBaseUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.targetApiKey}`
                    },
                    body: JSON.stringify(openaiReq)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('Proxy upstream error:', errText);
                    return res.status(response.status).json({ error: { message: errText } });
                }

                // 4. Translate Response back to Anthropic
                if (anthropicReq.stream) {
                    res.setHeader('Content-Type', 'text/event-stream');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Connection', 'keep-alive');
                    
                    res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', content: [], model: this.targetModel } })}\n\n`);

                    let buffer = '';
                    response.body.on('data', chunk => {
                        buffer += chunk.toString();
                        let lines = buffer.split('\n');
                        buffer = lines.pop();

                        for (const line of lines) {
                            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    const delta = data.choices[0]?.delta;
                                    
                                    if (delta?.content) {
                                        res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                                            type: 'content_block_delta',
                                            index: 0,
                                            delta: { type: 'text_delta', text: delta.content }
                                        })}\n\n`);
                                    }
                                    
                                    // Handle Tool Calls in streaming (simplified)
                                    // Full proxying of tool calls in streaming is complex, but DeepSeek usually returns tool_calls in chunks.
                                    // For simplicity in this proxy, we handle basic text streaming.
                                } catch (e) {}
                            }
                        }
                    });

                    response.body.on('end', () => {
                        res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
                        res.end();
                    });

                } else {
                    const data = await response.json();
                    const choice = data.choices[0].message;
                    
                    const content = [];
                    if (choice.content) {
                        content.push({ type: 'text', text: choice.content });
                    }
                    if (choice.tool_calls) {
                        for (const tc of choice.tool_calls) {
                            content.push({
                                type: 'tool_use',
                                id: tc.id,
                                name: tc.function.name,
                                input: JSON.parse(tc.function.arguments)
                            });
                        }
                    }

                    res.json({
                        id: 'msg_1',
                        type: 'message',
                        role: 'assistant',
                        model: this.targetModel,
                        content: content,
                        usage: {
                            input_tokens: data.usage?.prompt_tokens || 0,
                            output_tokens: data.usage?.completion_tokens || 0
                        }
                    });
                }

            } catch (err) {
                console.error('Proxy Error:', err);
                res.status(500).json({ error: { message: err.message } });
            }
        });
    }

    start(port = 3002) {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                console.log(`Anthropic -> OpenAI Proxy running on port ${port}`);
                resolve(port);
            });
        });
    }

    stop() {
        if (this.server) this.server.close();
    }
}

module.exports = new AnthropicProxy();
