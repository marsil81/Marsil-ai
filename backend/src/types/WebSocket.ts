/**
 * ⚡ MARSIL AI - WebSocket Type Definitions
 */

export type AgentStatus = 'idle' | 'executing_tool' | 'thinking' | 'speaking';

export type ClientMessageType = 'chat' | 'abort' | 'pong';

export interface ClientMessage {
    type: ClientMessageType;
    text?: string;
    lang?: 'en' | 'ar';
}

export interface ServerMessage {
    type: 'chat_reply' | 'chat_delta' | 'log' | 'metrics' | 'ping' | 'error' | 'agent_status';
    text?: string;
    message?: string;
    status?: AgentStatus;
    cpu?: string;
    ram?: string;
}
