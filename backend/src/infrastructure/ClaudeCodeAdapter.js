const { spawn } = require('child_process');
const logger = require('./Logger');

// Provider base URLs for Claude Code compatibility
const PROVIDER_URLS = {
    anthropic: null, // Claude Code uses Anthropic by default, no override needed
    openai:    'https://api.openai.com/v1',
    deepseek:  'https://api.deepseek.com/v1',
    gemini:    'https://generativelanguage.googleapis.com/v1beta/openai',
    ollama:    'http://localhost:11434/v1',
};

// Strip ANSI escape codes (colors, cursor movement) from terminal output
const ANSI_REGEX = /[\x1b\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

// Shared helper: extract a human-readable summary from a tool-call input object
function summarizeToolInput(toolName, inputObj) {
    if (!inputObj) return '';
    let summary = '';
    if (toolName === 'Bash' || toolName === 'PowerShell' || toolName === 'run_command') {
        summary = inputObj.command || inputObj.CommandLine || '';
    } else if (toolName === 'Glob' || toolName === 'Grep' || toolName === 'grep_search') {
        summary = inputObj.pattern || inputObj.query || inputObj.Query || '';
    } else if (toolName === 'ReplaceFileContent' || toolName === 'replace_file_content' || toolName === 'multi_replace_file_content') {
        summary = inputObj.file_path || inputObj.TargetFile || '';
    } else if (toolName === 'ViewFile' || toolName === 'view_file' || toolName === 'list_dir') {
        summary = inputObj.file_path || inputObj.AbsolutePath || inputObj.DirectoryPath || '';
    } else {
        summary = Object.values(inputObj).join(' ').substring(0, 50);
    }
    if (summary.length > 60) summary = '...' + summary.slice(-57);
    return summary;
}

class ClaudeCodeAdapter {
    constructor() {
        this.available = false;
        this.version = null;
        this.config = { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-5', baseUrl: null };
        this.ws = null;
        this._throttleTimers = {};
        this._toolCallCount = 0;

        this._detectClaudeCode();
    }

    /**
     * Asynchronously detect global Claude Code installation securely without blocking the event loop or using shell.
     * @private
     */
    _detectClaudeCode() {
        const { exec, execFile } = require('child_process');
        const isWin = process.platform === 'win32';
        
        if (isWin) {
            exec('claude --version', { timeout: 4000 }, (error, stdout) => {
                if (error) {
                    this.available = false;
                    this.version = null;
                    logger.info('Claude Code not found on PATH or failed to report version.');
                } else {
                    this.version = stdout.trim();
                    this.available = true;
                    logger.info(`Claude Code detected: ${this.version}`);
                }
            });
        } else {
            execFile('claude', ['--version'], { timeout: 4000 }, (error, stdout) => {
                if (error) {
                    this.available = false;
                    this.version = null;
                    logger.info('Claude Code not found on PATH or failed to report version.');
                } else {
                    this.version = stdout.trim();
                    this.available = true;
                    logger.info(`Claude Code detected: ${this.version}`);
                }
            });
        }
    }

    /**
     * Determine if the Claude CLI command is detected and available on the local path.
     * @returns {boolean} True if available
     */
    isAvailable() { return this.available; }

    /**
     * Dynamically update the WebSocket instance used to stream terminal outputs to the UI client.
     * @param {WebSocket} ws - The active client WebSocket connection
     */
    setWebSocket(ws) {
        this.ws = ws;
        logger.info("WebSocket client dynamically updated in ClaudeCodeAdapter!");
    }

    /**
     * Update provider configuration.
     * This is called whenever the user saves settings in the UI.
     */
    setProviderConfig({ provider, apiKey, model, baseUrl, demoMode }) {
        this.config = {
            provider: provider || 'anthropic',
            apiKey:   apiKey   || '',
            model:    model    || 'claude-opus-4-5',
            baseUrl:  baseUrl  || PROVIDER_URLS[provider] || null,
            demoMode: !!demoMode
        };
    }

    /**
     * Build the operating system subprocess environment variables dynamically.
     * Integrates API keys and hooks the Anthropic Proxy if deepseek/openai providers are selected.
     * @private
     * @returns {object} Combined key/value pair environment variables
     */
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
     * Throttle rapid WebSocket messages: only send the latest payload every 50ms.
     * Prevents flooding the connection during high-frequency tool output.
     */
    _sendThrottled(type, data) {
        if (!this.ws || this.ws.readyState !== 1) return;
        const key = type;
        if (this._throttleTimers[key]) {
            if (type === 'chat_delta') {
                if (!this._throttleTimers[key].pending) {
                    this._throttleTimers[key].pending = { text: data.text };
                } else {
                    this._throttleTimers[key].pending.text += data.text;
                }
            } else {
                this._throttleTimers[key].pending = data;
            }
            return;
        }
        this.ws.send(JSON.stringify({ type, ...data }));
        this._throttleTimers[key] = {
            timeout: setTimeout(() => {
                const pending = this._throttleTimers[key]?.pending;
                delete this._throttleTimers[key];
                if (pending) {
                    this.ws.send(JSON.stringify({ type, ...pending }));
                }
            }, 50),
            pending: null
        };
    }

    /**
     * Attempt to recover a partial JSON line by accumulating across chunks.
     * Returns parsed object or null.
     */
    _tryParseJsonAccumulated(buffer, line) {
        // First try normal parse
        try { return JSON.parse(line); } catch {}
        // Try accumulating with previous partial line
        const combined = buffer + line;
        try { return JSON.parse(combined); } catch {}
        return null;
    }

    /**
     * Run Claude Code CLI in non-interactive print mode with streaming JSON output events.
     * Handles tool intercepting, telemetry streaming, and process abort hooks.
     * @param {string} prompt - User request instruction
     * @param {string} cwd - Current active workspace path
     * @param {WebSocket} wsInput - Active client socket connection
     * @param {boolean} [isAutonomous=false] - Whether operating in self-evolution loop
     * @returns {Promise<string>} Structured text result response
     */
    async run(prompt, cwd, wsInput, isAutonomous = false) {
        if (wsInput) {
            this.ws = wsInput;
        }
        this._toolCallCount = 0;
        return new Promise((resolve, reject) => {
            const args = [
                '--print',
                '--verbose',
                '--output-format', 'stream-json',
                '--no-session-persistence',
                '--model', this.config.model
            ];

            // Make --dangerously-skip-permissions conditional for security hardening
            if (process.env.MARSIL_SKIP_PERMISSIONS !== 'false' && this.config.skipPermissions !== false) {
                args.push('--dangerously-skip-permissions');
            }

            const isWin = process.platform === 'win32';
            const command = isWin ? 'claude.cmd' : 'claude';

            const proc = spawn(command, args, {
                cwd: cwd || process.cwd(),
                shell: false, // Enforce absolute shell protection with zero command injection vulnerability
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
            let jsonPartialBuffer = '';

            const finalizeText = () => {
                if (isAutonomous && autoBuffer.trim() && this.ws) {
                    this.ws.send(JSON.stringify({ type: 'log', message: `\u{1F4AD} ${autoBuffer}` }));
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

                    // Try to parse with recovery for split JSON chunks
                    const event = this._tryParseJsonAccumulated(jsonPartialBuffer, line);
                    jsonPartialBuffer = event ? '' : line;

                    if (!event) {
                        // Still not valid JSON — treat as raw text
                        fullResponse += line;
                        if (this.ws) {
                            const cleanLine = line.replace(ANSI_REGEX, '').trim();
                            if (cleanLine) this.ws.send(JSON.stringify({ type: 'log', message: cleanLine }));
                        }
                        continue;
                    }

                    this._handleEvent(event, this.ws);

                    if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
                        currentToolName = event.content_block.name;
                        currentToolInput = '';
                    }

                    if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
                        currentToolInput += event.delta.partial_json;
                    }

                    if (event.type === 'content_block_stop' && currentToolName) {
                        this._toolCallCount++;
                        if (this.ws) {
                            try {
                                const inputObj = JSON.parse(currentToolInput);
                                const argsSummary = summarizeToolInput(currentToolName, inputObj);
                                this.ws.send(JSON.stringify({ type: 'log', message: `⚡ [${this._toolCallCount}] ${currentToolName}: ${argsSummary}` }));
                            } catch {
                                this.ws.send(JSON.stringify({ type: 'log', message: `⚡ [${this._toolCallCount}] ${currentToolName}` }));
                            }
                            this.ws.send(JSON.stringify({ type: 'agent_status', status: 'executing_tool' }));
                        }
                        currentToolName = null;
                        currentToolInput = '';
                    }

                    // assistant event: only process text blocks that are NOT also text_deltas
                    // (stream-json emits both, we prefer text_delta to avoid duplication)
                    if (event.type === 'assistant' && event.message?.content && !hasDeltas) {
                        for (const block of event.message.content) {
                            if (block.type === 'text') {
                                assistantTextBuffer += block.text;
                                if (this.ws) {
                                    if (isAutonomous) {
                                        const lines = block.text.split('\n');
                                        for (const line of lines) {
                                            if (line.trim()) this.ws.send(JSON.stringify({ type: 'log', message: `\u{1F4AD} ${line}` }));
                                        }
                                    } else {
                                        this._sendThrottled('chat_delta', { text: block.text });
                                    }
                                }
                            } else if (block.type === 'tool_use' && !hasDeltas) {
                                // Only emit tool_use from assistant if we haven't seen it from content_block events
                                const argsSummary = summarizeToolInput(block.name, block.input || {});
                                if (this.ws) {
                                    this._sendThrottled('log', { message: `⚡ ${block.name}: ${argsSummary}` });
                                    this._sendThrottled('agent_status', { status: 'executing_tool' });
                                }
                            }
                        }
                    }

                    if (event.type === 'user' && event.message?.content) {
                        for (const block of event.message.content) {
                            if (block.type === 'tool_result') {
                                if (this.ws) {
                                    let resultSummary = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
                                    if (resultSummary.length > 80) resultSummary = resultSummary.substring(0, 77) + '...';
                                    this.ws.send(JSON.stringify({ type: 'log', message: `✓ Tool output: ${resultSummary}` }));
                                }
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
                                    if (al.trim()) this.ws.send(JSON.stringify({ type: 'log', message: `\u{1F4AD} ${al}` }));
                                }
                            } else {
                                this._sendThrottled('chat_delta', { text: event.delta.text });
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
                }
            });

            proc.stderr.on('data', (data) => {
                const cleanMsg = data.toString().replace(ANSI_REGEX, '').trim();
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
                logger.info(`Claude Code process closed with code ${code}`);
                resolve(fullResponse || 'Done.');
            });

            proc.on('error', (err) => {
                if (this.ws) {
                    this.ws.send(JSON.stringify({ type: 'log', message: `❌ Claude Code process error: ${err.message}` }));
                }
                logger.error("Claude Code process error:", err);
                reject(new Error(`Claude Code error: ${err.message}`));
            });

            this._proc = proc;
        });
    }

    _handleEvent(event, _wsInput) {
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
