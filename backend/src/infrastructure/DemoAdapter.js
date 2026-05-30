/**
 * 🌌 MARSIL AI - Autonomous Demo Mode Simulation Adapter
 * ====================================================
 * Simulates high-fidelity, streaming agent reasoning, tool execution,
 * and connection diagnostics without requiring active API keys or local Claude CLI.
 */

const logger = require('./Logger');

// Helper to strip ANSI codes if needed
const ANSI_REGEX = /[\x1b\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

class DemoAdapter {
    constructor() {
        this.available = true;
        this.version = "marsil-demo-v1.0.0";
        this.ws = null;
    }

    isAvailable() {
        return true;
    }

    setWebSocket(ws) {
        this.ws = ws;
    }

    /**
     * Simulate high-fidelity streaming responses mirroring Claude Code protocol.
     * Streams thinking deltas, tool executions, and final summaries sequentially.
     */
    async run(prompt, cwd, wsInput, isAutonomous = false) {
        if (wsInput) {
            this.ws = wsInput;
        }

        const send = (type, payload) => {
            if (this.ws && this.ws.readyState === 1) {
                this.ws.send(JSON.stringify({ type, ...payload }));
            }
        };

        return new Promise((resolve) => {
            send('agent_status', { status: 'thinking' });
            send('log', { message: '🌌 Demo Mode: Initiating simulated agent session...' });

            // Step 1: Thinking & Log deltas
            setTimeout(() => {
                send('log', { message: '⚡ Scanning workspace files...' });
                send('log', { message: '✓ Found 12 matching files.' });
            }, 1000);

            // Step 2: Tool Call Simulation
            setTimeout(() => {
                send('agent_status', { status: 'executing_tool' });
                send('log', { message: '⚡ [1] view_file: /backend/src/presentation/Server.js' });
            }, 2500);

            // Step 3: Tool Output Simulation
            setTimeout(() => {
                send('log', { message: '✓ Tool output: File loaded successfully (399 lines).' });
                send('agent_status', { status: 'thinking' });
            }, 4000);

            // Step 4: Streaming Delta Response
            let responseText = `🌌 **MARSIL DEMO MODE ACTIVE** 🌌\n\n` +
                `Greetings! This is a simulated high-fidelity agent response.\n` +
                `I successfully intercepted your query: *"${prompt.substring(0, 40)}..."*\n\n` +
                `### Workspace Audit Results:\n` +
                `- **File Integrity:** 100% Secure.\n` +
                `- **Subprocess Spawns:** Hardened.\n` +
                `- **WebSocket:** Promotable to Secure (wss://).\n\n` +
                `To begin real development, please toggle Demo Mode off and configure your Anthropic API key.`;

            let currentIndex = 0;
            const words = responseText.split(' ');
            
            const interval = setInterval(() => {
                if (currentIndex >= words.length) {
                    clearInterval(interval);
                    
                    // Final Token Usage Event
                    send('token_usage', {
                        tokensIn: 145,
                        tokensOut: 280,
                        totalTokens: 425,
                        provider: 'marsil-demo',
                        model: 'demo-simulation-model'
                    });
                    
                    send('agent_status', { status: 'idle' });
                    send('log', { message: '✓ Demo cycle completed safely.' });
                    resolve(responseText);
                    return;
                }

                const deltaText = words[currentIndex] + ' ';
                send('chat_delta', { text: deltaText });
                currentIndex++;
            }, 80);
        });
    }

    abort() {
        if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'log', message: '🛑 Demo task aborted by user.' }));
        }
    }
}

module.exports = new DemoAdapter();
