const { spawn, execSync } = require('child_process');

// Provider base URLs for Claude Code compatibility
const PROVIDER_URLS = {
    anthropic: null, // Claude Code uses Anthropic by default, no override needed
    openai:    'https://api.openai.com/v1',
    deepseek:  'https://api.deepseek.com/v1',
    gemini:    'https://generativelanguage.googleapis.com/v1beta/openai',
    ollama:    'http://localhost:11434/v1',
};

class ClaudeCodeAdapter {
    constructor() {
        this.available = false;
        this.version = null;
        this.config = { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-5', baseUrl: null };
        this.ws = null;

        try {
            const out = execSync('claude --version', { timeout: 5000, encoding: 'utf-8' });
            this.version = out.trim();
            this.available = true;
            console.log(`Claude Code detected: ${this.version}`);
        } catch {
            this.available = false;
            console.log('Claude Code not found on PATH');
        }
    }

    isAvailable() { return this.available; }

    setWebSocket(ws) { 
        this.ws = ws; 
        console.log("WebSocket client dynamically updated in ClaudeCodeAdapter!");
    }

    /**
     * Update provider configuration.
     * This is called whenever the user saves settings in the UI.
     */
    setProviderConfig({ provider, apiKey, model, baseUrl }) {
        this.config = {
            provider: provider || 'anthropic',
            apiKey:   apiKey   || '',
            model:    model    || 'claude-opus-4-5',
            baseUrl:  baseUrl  || PROVIDER_URLS[provider] || null,
        };
    }

    _buildEnv() {
        const env = { ...process.env };

        if (this.config.provider === 'anthropic') {
            if (this.config.apiKey) {
                env.ANTHROPIC_API_KEY = this.config.apiKey;
            }
            delete env.ANTHROPIC_BASE_URL;
        } else {
            // For OpenAI-compatible providers, we route Claude Code through our local proxy
            env.ANTHROPIC_API_KEY = 'sk-ant-dummy-key-for-local-proxy';
            env.ANTHROPIC_BASE_URL = 'http://localhost:3002';
        }

        return env;
    }

    /**
     * Run Claude Code in non-interactive print mode with streaming JSON output.
     */
    async run(prompt, cwd, wsInput, isAutonomous = false) {
        if (wsInput) {
            this.ws = wsInput;
        }
        return new Promise((resolve, reject) => {
            const args = [
                '--print',
                '--verbose',
                '--output-format', 'stream-json',
                '--no-session-persistence',
                '--dangerously-skip-permissions',
                '--model', this.config.model
            ];

            const proc = spawn('claude', args, {
                cwd: cwd || process.cwd(),
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: this._buildEnv()
            });

            proc.stdin.write(prompt + "\n");
            proc.stdin.end();

            let fullResponse = '';
            let buffer = '';
            let autoBuffer = '';
            let tokensIn = 0;
            let tokensOut = 0;
            let assistantTextBuffer = '';
            let hasDeltas = false;
            let currentToolName = null;
            let currentToolInput = '';

            const finalizeText = () => {
                if (isAutonomous && autoBuffer.trim() && this.ws) {
                    this.ws.send(JSON.stringify({ type: 'log', message: `💭 ${autoBuffer}` }));
                    autoBuffer = '';
                }
                if (!hasDeltas && assistantTextBuffer) {
                    fullResponse += assistantTextBuffer;
                    if (this.ws && !isAutonomous) {
                        this.ws.send(JSON.stringify({ type: 'chat_delta', text: assistantTextBuffer }));
                    }
                    assistantTextBuffer = '';
                }
            };

            proc.stdout.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);
                        this._handleEvent(event, this.ws);

                        if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
                            currentToolName = event.content_block.name;
                            currentToolInput = '';
                        }
                        
                        if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
                            currentToolInput += event.delta.partial_json;
                        }

                        if (event.type === 'content_block_stop' && currentToolName) {
                            if (this.ws) {
                                try {
                                    const inputObj = JSON.parse(currentToolInput);
                                    let argsSummary = '';
                                    
                                    // Make logs highly readable for the user based on tool type
                                    if (currentToolName === 'Bash' || currentToolName === 'PowerShell' || currentToolName === 'run_command') {
                                        argsSummary = inputObj.command || inputObj.CommandLine || '';
                                    } else if (currentToolName === 'Glob' || currentToolName === 'Grep' || currentToolName === 'grep_search') {
                                        argsSummary = inputObj.pattern || inputObj.query || inputObj.Query || '';
                                    } else if (currentToolName === 'ReplaceFileContent' || currentToolName === 'replace_file_content' || currentToolName === 'multi_replace_file_content') {
                                        argsSummary = inputObj.file_path || inputObj.TargetFile || '';
                                    } else if (currentToolName === 'ViewFile' || currentToolName === 'view_file' || currentToolName === 'list_dir') {
                                        argsSummary = inputObj.file_path || inputObj.AbsolutePath || inputObj.DirectoryPath || '';
                                    } else {
                                        argsSummary = Object.values(inputObj).join(' ').substring(0, 50);
                                    }
                                    
                                    // Clean up long paths for better UI readability
                                    if (argsSummary.length > 60) argsSummary = '...' + argsSummary.slice(-57);

                                    this.ws.send(JSON.stringify({ type: 'log', message: `⚡ ${currentToolName}: ${argsSummary}` }));
                                } catch (e) {
                                    this.ws.send(JSON.stringify({ type: 'log', message: `⚡ ${currentToolName}` }));
                                }
                                this.ws.send(JSON.stringify({ type: 'agent_status', status: 'executing_tool' }));
                            }
                            currentToolName = null;
                            currentToolInput = '';
                        }

                        if (event.type === 'assistant' && event.message?.content) {
                            for (const block of event.message.content) {
                                if (block.type === 'text') {
                                    assistantTextBuffer += block.text;
                                }
                            }
                        }
                        
                        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta?.text) {
                            hasDeltas = true;
                            fullResponse += event.delta.text;
                            if (this.ws) {
                                if (isAutonomous) {
                                    autoBuffer += event.delta.text;
                                    const aLines = autoBuffer.split('\n');
                                    autoBuffer = aLines.pop();
                                    for (const al of aLines) {
                                        if (al.trim()) this.ws.send(JSON.stringify({ type: 'log', message: `💭 ${al}` }));
                                    }
                                } else {
                                    this.ws.send(JSON.stringify({ type: 'chat_delta', text: event.delta.text }));
                                }
                            }
                        }
                        if (event.type === 'error') {
                            if (this.ws) {
                                this.ws.send(JSON.stringify({ type: 'log', message: `❌ Error: ${event.error?.message || event.message || JSON.stringify(event)}` }));
                            }
                        }
                        if (event.type === 'result') {
                            finalizeText();
                            if (event.result && !fullResponse) {
                                fullResponse = String(event.result);
                                if (this.ws && !isAutonomous) {
                                    this.ws.send(JSON.stringify({ type: 'chat_delta', text: String(event.result) }));
                                }
                            }
                            tokensIn  = event.total_tokens_in  || 0;
                            tokensOut = event.total_tokens_out || 0;
                            if (this.ws) {
                                this.ws.send(JSON.stringify({
                                    type: 'token_usage',
                                    tokensIn,
                                    tokensOut,
                                    totalTokens: tokensIn + tokensOut,
                                    provider: this.config.provider,
                                    model: this.config.model
                                }));
                            }
                        }
                    } catch {
                        fullResponse += line;
                        if (this.ws) {
                            const cleanLine = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
                            if (cleanLine) this.ws.send(JSON.stringify({ type: 'log', message: cleanLine }));
                        }
                    }
                }
            });

            proc.stderr.on('data', (data) => {
                const cleanMsg = data.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
                if (cleanMsg && this.ws) {
                    this.ws.send(JSON.stringify({ type: 'log', message: cleanMsg }));
                }
            });

            proc.on('close', (code) => {
                finalizeText();
                if (this.ws) {
                    this.ws.send(JSON.stringify({ type: 'agent_status', status: 'idle' }));
                    if (code !== 0) {
                        this.ws.send(JSON.stringify({ type: 'log', message: `❌ Claude Code process exited with error code ${code}` }));
                    }
                }
                console.log(`Claude Code process closed with code ${code}`);
                resolve(fullResponse || 'Done.');
            });

            proc.on('error', (err) => {
                if (this.ws) {
                    this.ws.send(JSON.stringify({ type: 'log', message: `❌ Claude Code process error: ${err.message}` }));
                }
                console.error("Claude Code process error:", err);
                reject(new Error(`Claude Code error: ${err.message}`));
            });

            this._proc = proc;
        });
    }

    _handleEvent(event, wsInput) {
        if (!this.ws) return;
        if (event.type === 'system' || event.type === 'assistant') {
            this.ws.send(JSON.stringify({ type: 'agent_status', status: 'thinking' }));
        }
    }

    abort() {
        if (this._proc && !this._proc.killed) {
            this._proc.kill('SIGTERM');
            this._proc = null;
        }
    }
}

module.exports = new ClaudeCodeAdapter();
