/**
 * ⚡ MARSIL AI - Secure TypeScript WebSocket Connection Handler
 * =============================================================
 * Handles real-time telemetry streaming, keepalive checks, and
 * shields the agent service with strict input sanitization.
 *
 * Security fixes applied:
 *  - #4:  Session-token auth checked on first message (handshake)
 *  - #7:  Per-session AgentService instance — no shared Singleton state
 *  - #12: Per-connection WebSocket message rate limiting (10 msg/s)
 */

import os from 'os';
import WebSocket from 'ws';
import AgentService from '../application/AgentService';
import logger from '../infrastructure/Logger';
import { ClientMessage } from '../types/WebSocket';

const MAX_MESSAGE_SIZE = 1024 * 100; // 100KB max per WebSocket message
const MAX_TEXT_LENGTH  = 10000;      // 10K chars max for chat text
const ALLOWED_TYPES: string[] = ['chat', 'abort', 'pong'];

// ── #12: Per-connection rate limit ─────────────────────────────────────────
const WS_RATE_LIMIT    = 10; // max messages per window
const WS_RATE_WINDOW   = 1000; // ms window

interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateMessage(msg: any): ValidationResult {
    if (!msg || typeof msg !== 'object') {
        return { valid: false, error: 'Message must be a JSON object' };
    }
    if (!msg.type || !ALLOWED_TYPES.includes(msg.type)) {
        return { valid: false, error: `Invalid message type: "${msg.type}"` };
    }
    if (msg.type === 'chat') {
        if (typeof msg.text !== 'string') {
            return { valid: false, error: 'Chat text must be a string' };
        }
        if (msg.text.length > MAX_TEXT_LENGTH) {
            return { valid: false, error: `Chat text exceeds ${MAX_TEXT_LENGTH} characters` };
        }
    }
    return { valid: true };
}

export class WebSocketHandler {
    // ── #4: Session token — generated once at startup, printed to console ──
    public readonly SESSION_TOKEN: string;

    constructor() {
        const crypto = require('crypto');
        this.SESSION_TOKEN = crypto.randomBytes(32).toString('hex');
        logger.info(`\n🔑  WS Session Token: ${this.SESSION_TOKEN}\n`);
    }

    public handleConnection(ws: WebSocket, req: any): void {
        // ── #7: Per-session AgentService ─────────────────────────────────
        const session = new AgentService();
        session.setWebSocketClient(ws);

        let isAlive   = true;
        let authorized = false;

        // ── #12: Message rate-limit counters ─────────────────────────────
        let msgCount  = 0;
        const rateClearTimer = setInterval(() => { msgCount = 0; }, WS_RATE_WINDOW);

        const safeClose = (code: number, reason: string) => {
            clearInterval(interval);
            clearInterval(rateClearTimer);
            session.cleanup();
            if (ws.readyState === 1) ws.close(code, reason);
        };

        ws.on('message', async (message: WebSocket.Data) => {
            const messageStr = message.toString();

            // ── #12: Rate limit ─────────────────────────────────────────
            msgCount++;
            if (msgCount > WS_RATE_LIMIT) {
                ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded — slow down.' }));
                safeClose(4029, 'Rate limit exceeded');
                return;
            }

            // ── Max size guard ──────────────────────────────────────────
            if (Buffer.byteLength(messageStr, 'utf-8') > MAX_MESSAGE_SIZE) {
                ws.send(JSON.stringify({ type: 'error', message: `Message exceeds ${MAX_MESSAGE_SIZE / 1024}KB limit` }));
                return;
            }

            try {
                const msg = JSON.parse(messageStr) as ClientMessage;
                const validation = validateMessage(msg);
                if (!validation.valid) {
                    ws.send(JSON.stringify({ type: 'error', message: validation.error }));
                    return;
                }

                // ── #4: Auth check — first 'chat' message must carry token ─
                if (!authorized) {
                    if (msg.type !== 'chat' || msg.token !== this.SESSION_TOKEN) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized — invalid session token' }));
                        safeClose(4001, 'Unauthorized');
                        return;
                    }
                    authorized = true;
                    ws.send(JSON.stringify({ type: 'log', message: '✅ Session authorized.' }));
                }

                if (msg.type === 'pong') {
                    isAlive = true;
                    return;
                }

                if (msg.type === 'chat') {
                    const reply = await session.processUserMessage(msg.text || '', false, msg.lang || 'en');
                    if (reply) {
                        ws.send(JSON.stringify({ type: 'chat_reply', text: reply }));
                    }
                } else if (msg.type === 'abort') {
                    const reply = session.abortCurrentTask();
                    ws.send(JSON.stringify({ type: 'log', message: reply }));
                    ws.send(JSON.stringify({ type: 'agent_status', status: 'idle' }));
                } else {
                    logger.debug(`Unknown WebSocket message type: "${msg.type}"`);
                }
            } catch {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message format' }));
            }
        });

        // ── Metrics & keepalive heartbeat ─────────────────────────────────
        const interval = setInterval(() => {
            if (ws.readyState !== 1) {
                clearInterval(interval);
                return;
            }
            if (!isAlive) {
                safeClose(1001, 'Keepalive timeout');
                return;
            }
            isAlive = false;
            ws.send(JSON.stringify({ type: 'ping' }));

            const memFree  = os.freemem();
            const memTotal = os.totalmem();
            const memUsage = (((memTotal - memFree) / memTotal) * 100).toFixed(1);
            ws.send(JSON.stringify({
                type: 'metrics',
                cpu:  logger.calculateCpuLoad(),
                ram:  memUsage
            }));
        }, 5000);

        ws.on('close', () => {
            clearInterval(interval);
            clearInterval(rateClearTimer);
            isAlive = false;
            session.cleanup();
        });

        ws.on('error', () => {
            clearInterval(interval);
            clearInterval(rateClearTimer);
            session.cleanup();
            ws.terminate();
        });
    }
}

export default new WebSocketHandler();
