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
    async run(prompt, cwd, ws) {
        return new Promise((resolve, reject) => {
            const args = [
                '--print',
                '--verbose',
                '--output-format', 'stream-json',
                '--no-session-persistence',
                '--model', this.config.model,
                prompt
            ];

            const proc = spawn('claude', args, {
                cwd: cwd || process.cwd(),
                shell: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                env: this._buildEnv()
            });

            let fullResponse = '';
            let buffer = '';
            let tokensIn = 0;
            let tokensOut = 0;

            proc.stdout.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);
                        this._handleEvent(event, ws);

                        if (event.type === 'assistant' && event.message?.content) {
                            for (const block of event.message.content) {
                                if (block.type === 'text') {
                                    fullResponse += block.text;
                                    if (ws) {
                                        ws.send(JSON.stringify({ type: 'chat_delta', text: block.text }));
                                    }
                                }
                            }
                        }
                        if (event.type === 'content_block_delta' && event.delta?.text) {
                            fullResponse += event.delta.text;
                            if (ws) {
                                ws.send(JSON.stringify({ type: 'chat_delta', text: event.delta.text }));
                            }
                        }
                        if (event.type === 'result') {
                            if (event.result && !fullResponse) {
                                fullResponse = String(event.result);
                                if (ws) {
                                    ws.send(JSON.stringify({ type: 'chat_delta', text: String(event.result) }));
                                }
                            }
                            tokensIn  = event.total_tokens_in  || 0;
                            tokensOut = event.total_tokens_out || 0;
                            if (ws) {
                                ws.send(JSON.stringify({
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
                    }
                }
            });

            proc.stderr.on('data', (data) => {
                if (ws) ws.send(JSON.stringify({ type: 'log', message: data.toString().trim() }));
            });

            proc.on('close', () => {
                if (ws) ws.send(JSON.stringify({ type: 'agent_status', status: 'idle' }));
                resolve(fullResponse || 'Done.');
            });

            proc.on('error', (err) => reject(new Error(`Claude Code error: ${err.message}`)));

            this._proc = proc;
        });
    }

    _handleEvent(event, ws) {
        if (!ws) return;
        if (event.type === 'system' || event.type === 'assistant') {
            ws.send(JSON.stringify({ type: 'agent_status', status: 'thinking' }));
            if (event.message?.content) {
                for (const b of event.message.content) {
                    if (b.type === 'tool_use') {
                        ws.send(JSON.stringify({ type: 'log', message: `⚡ ${b.name}` }));
                        ws.send(JSON.stringify({ type: 'agent_status', status: 'executing_tool' }));
                    }
                }
            }
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
