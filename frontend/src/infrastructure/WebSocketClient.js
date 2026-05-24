export class AgentWebSocketClient {
    constructor() {
        this.socket = null;
        this.onStatusChange   = () => {};
        this.onMetricsChange  = () => {};
        this.onTerminalOutput = () => {};
        this.onChatReply      = () => {};
        this.onChatDelta      = () => {};
        this.onSystemLog      = () => {};
        this.onTokenUpdate    = () => {};  // now receives full token object
    }

    connect() {
        this.socket = new WebSocket('ws://localhost:3001');
        this.socket.onopen = () => console.log('Connected to Marsil Core');
        this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'agent_status')
                this.onStatusChange(msg.status);
            if (msg.type === 'metrics')
                this.onMetricsChange({ cpu: msg.cpu, ram: msg.ram });
            if (msg.type === 'terminal_output' || msg.type === 'terminal_error')
                this.onTerminalOutput(msg.data);
            if (msg.type === 'chat_reply')
                this.onChatReply(msg.text);
            if (msg.type === 'chat_delta')
                this.onChatDelta(msg.text);
            if (msg.type === 'log')
                this.onSystemLog(msg.message);
            if (msg.type === 'token_usage') {
                // Pass full token details: { tokensIn, tokensOut, totalTokens, provider, model }
                this.onTokenUpdate(msg);
            }
        };
        this.socket.onclose = () => console.log('Disconnected from Marsil Core');
    }

    sendChat(text) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify({ type: 'chat', text }));
    }

    sendAbort() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify({ type: 'abort' }));
    }

    disconnect() { if (this.socket) this.socket.close(); }
}
