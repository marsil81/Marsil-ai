/**
 * ⚡ MARSIL AI - Secure TypeScript WebSocket Connection Handler
 * =============================================================
 * Handles real-time telemetry streaming, keepalive checks, and
 * shields the agent service with strict input sanitization.
 */

import os from 'os';
import WebSocket from 'ws';
import agentService from '../application/AgentService';
import logger from '../infrastructure/Logger';
import { ClientMessage } from '../types/WebSocket';

const MAX_MESSAGE_SIZE = 1024 * 100; // 100KB max per WebSocket message
const MAX_TEXT_LENGTH = 10000;       // 10K chars max for chat text (enhanced rate-limiting security)
const ALLOWED_TYPES: string[] = ['chat', 'abort', 'pong'];

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
    public handleConnection(ws: WebSocket): void {
        agentService.setWebSocketClient(ws);
        let isAlive = true;

        ws.on('message', async (message: WebSocket.Data) => {
            const messageStr = message.toString();

            // Enforce message size limit
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

                if (msg.type === 'pong') {
                    isAlive = true;
                    return;
                }

                if (msg.type === 'chat') {
                    const reply = await agentService.processUserMessage(msg.text || '', false, msg.lang || 'en');
                    if (reply) {
                        ws.send(JSON.stringify({ type: 'chat_reply', text: reply }));
                    }
                } else if (msg.type === 'abort') {
                    const reply = agentService.abortCurrentTask();
                    ws.send(JSON.stringify({ type: 'log', message: reply }));
                    ws.send(JSON.stringify({ type: 'agent_status', status: 'idle' }));
                } else {
                    logger.debug(`Unknown WebSocket message type: "${msg.type}"`);
                }
            } catch {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message format' }));
            }
        });

        // Metrics & keepalive heartbeat
        const interval = setInterval(() => {
            if (ws.readyState !== 1) {
                clearInterval(interval);
                return;
            }
            // Ping-pong keepalive
            if (!isAlive) {
                ws.terminate();
                clearInterval(interval);
                return;
            }
            isAlive = false;
            ws.send(JSON.stringify({ type: 'ping' }));

            // System metrics
            const memFree = os.freemem();
            const memTotal = os.totalmem();
            const memUsage = (((memTotal - memFree) / memTotal) * 100).toFixed(1);

            ws.send(JSON.stringify({
                type: 'metrics',
                cpu: logger.calculateCpuLoad(),
                ram: memUsage
            }));
        }, 5000);

        ws.on('close', () => {
            clearInterval(interval);
            isAlive = false;
            agentService.cleanup();
        });

        ws.on('error', () => {
            clearInterval(interval);
            ws.terminate();
            agentService.cleanup();
        });
    }
}

export default new WebSocketHandler();
