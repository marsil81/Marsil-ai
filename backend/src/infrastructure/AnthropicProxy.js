const express = require('express');
const fetch = require('node-fetch');
const logger = require('./Logger');

function cleanSchema(schema) {
    if (!schema || typeof schema !== 'object') return schema;
    const clean = Array.isArray(schema) ? [] : {};
    for (const key in schema) {
        if (key === '$schema') continue;
        const value = schema[key];
        if (typeof value === 'object' && value !== null) {
            clean[key] = cleanSchema(value);
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

function parseToolInput(tc, choiceContent) {
    logger.debug("parseToolInput", { name: tc.function.name });
    
    let parsedInput = {};
    try {
        parsedInput = JSON.parse(tc.function.arguments);
    } catch {}

    if (tc.function.name === 'PowerShell' || tc.function.name === 'Bash') {
        if (!parsedInput.command || !parsedInput.command.trim()) {
            let extracted = '';
            const codeBlockMatch = choiceContent?.match(/```(?:powershell|bash|sh|cmd|shell)?\n([\s\S]*?)\n```/i);
            if (codeBlockMatch) {
                extracted = codeBlockMatch[1].trim();
            }
            if (!extracted) {
                const inlineMatch = choiceContent?.match(/`([^`\n]+)`/);
                if (inlineMatch && inlineMatch[1].length < 150) {
                    extracted = inlineMatch[1].trim();
                }
            }
            if (!extracted) {
                extracted = "";
            }
            parsedInput.command = extracted;
        }
    }
    logger.debug("parseToolInput outgoing", { command: parsedInput.command });
    return parsedInput;
}

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
                    sysText += "\n\nCRITICAL: When choosing to invoke a tool, you MUST populate all required parameters within the arguments JSON. For instance, if you call Bash or PowerShell, you must supply the 'command' string argument. Never output an empty arguments object like '{}'. Doing so will cause execution failures.";
                    openaiMessages.push({ role: 'system', content: sysText });
                }

                for (const msg of anthropicReq.messages) {
                    const content = msg.content;
                    if (Array.isArray(content)) {
                        // Handle text and tool_use / tool_result
                        const textParts = [];
                        const toolCalls = [];
                        
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
                        parameters: cleanSchema(t.input_schema)
                    }
                })) || undefined;

                // 3. Make Request to OpenAI / DeepSeek (Using stream: false for stable tool use translation)
                const openaiReq = {
                    model: this.targetModel,
                    messages: openaiMessages,
                    tools: openaiTools,
                    stream: false,
                    temperature: anthropicReq.temperature !== undefined ? anthropicReq.temperature : 0.7,
                    max_tokens: anthropicReq.max_tokens !== undefined ? anthropicReq.max_tokens : 4000
                };

                let cleanUrl = this.targetBaseUrl || 'https://api.deepseek.com';
                if (cleanUrl.endsWith('/v1')) {
                    cleanUrl = cleanUrl.slice(0, -3);
                }

                                let response;
                let attempts = 0;
                const maxAttempts = 4;
                while (attempts < maxAttempts) {
                    attempts++;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 60000);
                    try {
                        response = await fetch(`${cleanUrl}/v1/chat/completions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.targetApiKey}`,
                                'User-Agent': 'MarsilAI/1.0.0 (Desktop Coding Companion & Developer Assistant; +https://github.com/marsil81/Marsil-ai)',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(openaiReq),
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        break;
                    } catch (fetchErr) {
                        clearTimeout(timeoutId);
                        logger.error(`Proxy Fetch Attempt ${attempts} failed: ${fetchErr.message}`);
                        if (attempts >= maxAttempts) {
                            throw fetchErr;
                        }
                        await new Promise(r => setTimeout(r, 2000 * attempts));
                    }
                }

                if (!response.ok) {
                    const errText = await response.text();
                    logger.error('Proxy upstream error:', errText);
                    return res.status(response.status).json({ error: { message: errText } });
                }

                const data = await response.json();
                const choice = data.choices?.[0]?.message || { content: '' };
                if (choice.tool_calls) {
                    logger.info("=== PROXY RECEIVED TOOL CALLS ===");
                    logger.info(JSON.stringify(choice.tool_calls, null, 2));
                } else {
                    logger.info("=== PROXY RECEIVED TEXT ONLY ===");
                    logger.info(choice.content);
                }

                // 4. Translate Response back to Anthropic
                if (anthropicReq.stream) {
                    res.setHeader('Content-Type', 'text/event-stream');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Connection', 'keep-alive');
                    
                    // 1. message_start
                    res.write(`event: message_start\ndata: ${JSON.stringify({ 
                        type: 'message_start', 
                        message: { id: 'msg_' + Date.now(), type: 'message', role: 'assistant', content: [], model: this.targetModel } 
                    })}\n\n`);

                    // 2. Text delta if content exists
                    if (choice.content) {
                        res.write(`event: content_block_start\ndata: ${JSON.stringify({
                            type: 'content_block_start',
                            index: 0,
                            content_block: { type: 'text', text: '' }
                        })}\n\n`);

                        res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                            type: 'content_block_delta',
                            index: 0,
                            delta: { type: 'text_delta', text: choice.content }
                        })}\n\n`);

                        res.write(`event: content_block_stop\ndata: ${JSON.stringify({
                            type: 'content_block_stop',
                            index: 0
                        })}\n\n`);
                    }

                    // 3. Tool use start/delta/stop if tool_calls exist
                    if (choice.tool_calls) {
                        let blockIndex = choice.content ? 1 : 0;
                        for (const tc of choice.tool_calls) {
                            const parsedInput = parseToolInput(tc, choice.content);

                            res.write(`event: content_block_start\ndata: ${JSON.stringify({
                                type: 'content_block_start',
                                index: blockIndex,
                                content_block: { 
                                    type: 'tool_use', 
                                    id: tc.id, 
                                    name: tc.function.name, 
                                    input: {} 
                                }
                            })}\n\n`);

                            const inputStr = JSON.stringify(parsedInput);
                            res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                                type: 'content_block_delta',
                                index: blockIndex,
                                delta: {
                                    type: 'input_json_delta',
                                    partial_json: inputStr
                                }
                            })}\n\n`);

                            res.write(`event: content_block_stop\ndata: ${JSON.stringify({
                                type: 'content_block_stop',
                                index: blockIndex
                            })}\n\n`);

                            blockIndex++;
                        }
                    }

                    // 4. message_delta & message_stop
                    res.write(`event: message_delta\ndata: ${JSON.stringify({
                        type: 'message_delta',
                        delta: { stop_reason: choice.tool_calls ? 'tool_use' : 'end_turn', stop_sequence: null },
                        usage: {
                            output_tokens: data.usage?.completion_tokens || 0
                        }
                    })}\n\n`);

                    res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
                    res.end();

                } else {
                    const content = [];
                    if (choice.content) {
                        content.push({ type: 'text', text: choice.content });
                    }
                    if (choice.tool_calls) {
                        for (const tc of choice.tool_calls) {
                            const parsedInput = parseToolInput(tc, choice.content);

                            content.push({
                                type: 'tool_use',
                                id: tc.id,
                                name: tc.function.name,
                                input: parsedInput
                            });
                        }
                    }

                    res.json({
                        id: 'msg_' + Date.now(),
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
                logger.error('Proxy Error:', err);
                res.status(500).json({ error: { message: err.message } });
            }
        });
    }

    start(port = 3002) {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                logger.info(`Anthropic -> OpenAI Proxy running on port ${port}`);
                resolve(port);
            });
        });
    }

    stop() {
        if (this.server) this.server.close();
    }

    isRunning() {
        return this.server && this.server.listening;
    }
}

module.exports = new AnthropicProxy();
