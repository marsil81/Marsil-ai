const claudeCode = require('../infrastructure/ClaudeCodeAdapter');
const git = require('../infrastructure/GitAdapter');

const SYSTEM_PROMPT = `You are Marsil, an expert AI coding assistant embedded inside a developer's local workspace.
You have full access to tools: read files, write files, run terminal commands, and list directories.
Be precise, write clean code, and always explain what you did briefly after completing a task.
Never modify files outside the current workspace.`;

class AgentService {
    constructor() {
        this.wsClient = null;
    }

    setWebSocketClient(ws) {
        this.wsClient = ws;
    }

    _send(type, data) {
        if (this.wsClient && this.wsClient.readyState === 1) {
            this.wsClient.send(JSON.stringify({ type, ...data }));
        }
    }

    async processUserMessage(userMessage) {
        try {
            // Auto-checkpoint before any agent action so we can revert safely
            await git.checkpoint('Auto-checkpoint before agent action');

            if (!claudeCode.isAvailable()) {
                this._send('agent_status', { status: 'error' });
                this._send('log', { message: '❌ Claude Code not installed. Please install it: npm i -g @anthropic-ai/claude-code' });
                return 'Claude Code is not installed. Please install it first.';
            }

            this._send('agent_status', { status: 'thinking' });
            const response = await claudeCode.run(userMessage, process.cwd(), this.wsClient);
            this._send('agent_status', { status: 'idle' });
            return response;

        } catch (error) {
            this._send('agent_status', { status: 'error' });
            this._send('log', { message: `❌ Error: ${error.message}` });
            return `Error: ${error.message}`;
        }
    }

    abortCurrentTask() {
        claudeCode.abort();
        this._send('agent_status', { status: 'idle' });
        this._send('log', { message: '🛑 Task aborted by user.' });
        return 'Task aborted.';
    }
}

module.exports = new AgentService();
