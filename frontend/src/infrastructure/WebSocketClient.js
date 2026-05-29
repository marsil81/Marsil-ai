export class AgentWebSocketClient {
    constructor() {
        this.socket = null;
        this.onStatusChange   = () => {};
        this.onMetricsChange  = () => {};
        this.onTerminalOutput = () => {};
        this.onChatReply      = () => {};
        this.onChatDelta      = () => {};
        this.onSystemLog      = () => {};
        this.onTokenUpdate    = () => {};
        this.onConnectionChange = () => {}; // 'connected' | 'reconnecting' | 'disconnected'
        this.onLatencyUpdate  = () => {}; // (ms) => void

        // Auto-reconnect state
        this._reconnectAttempts = 0;
        this._maxReconnectAttempts = 10;
        this._reconnectDelay = 1000; // starts at 1s, doubles each attempt
        this._reconnectTimer = null;
        this._disposed = false;
        this._url = 'ws://localhost:3001';
        this._latencyMs = 0;
        this._pingTimer = null;
        this._pingStart = 0;
    }

    connect() {
        this._disposed = false;
        this._doConnect();
    }

    _startLatencyProbe() {
        this._stopLatencyProbe();
        this._pingTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this._pingStart = Date.now();
                this.socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 15000);
    }

    _stopLatencyProbe() {
        if (this._pingTimer) {
            clearInterval(this._pingTimer);
            this._pingTimer = null;
        }
    }

    _doConnect() {
        if (this._disposed) return;
        this.socket = new WebSocket(this._url);

        this.socket.onopen = () => {
            console.log('Connected to Marsil Core');
            this._reconnectAttempts = 0;
            this._reconnectDelay = 1000;
            this.onConnectionChange('connected');
            this._startLatencyProbe();
        };

        this.socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                // Respond to ping immediately to keep connection alive
                if (msg.type === 'ping') {
                    this.sendPong();
                    return;
                }
                if (msg.type === 'pong') {
                    if (this._pingStart > 0) {
                        this._latencyMs = Date.now() - this._pingStart;
                        this._pingStart = 0;
                        this.onLatencyUpdate(this._latencyMs);
                    }
                    return;
                }
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
                    this.onTokenUpdate(msg);
                }
            } catch (e) {
                console.warn('Failed to parse WebSocket message:', e);
            }
        };

        this.socket.onclose = () => {
            console.log('Disconnected from Marsil Core');
            // Auto-reconnect with exponential backoff unless intentionally closed
            if (!this._disposed && this._reconnectAttempts < this._maxReconnectAttempts) {
                this._reconnectAttempts++;
                const delay = Math.min(this._reconnectDelay, 30000);
                this._reconnectDelay *= 2; // exponential backoff
                console.log(`Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts})...`);
                this.onConnectionChange('reconnecting');
                this.onSystemLog(`🔄 Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this._reconnectAttempts})...`);
                this._reconnectTimer = setTimeout(() => this._doConnect(), delay);
            } else if (!this._disposed) {
                this.onConnectionChange('disconnected');
                this.onSystemLog('❌ Max reconnection attempts reached. Please refresh the page.');
            }
        };

        this.socket.onerror = () => {
            // onclose fires after onerror, so reconnect logic lives there
        };
    }

    sendChat(text, lang = 'en') {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify({ type: 'chat', text, lang }));
    }

    sendAbort() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify({ type: 'abort' }));
    }

    sendPong() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify({ type: 'pong' }));
    }

    disconnect() {
        this._disposed = true;
        this._stopLatencyProbe();
        clearTimeout(this._reconnectTimer);
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
