const os = require('os');
const agentService = require('../application/AgentService');
const logger = require('../infrastructure/Logger');

// ── Input Validation ────────────────────────────────────────────────────────────
const MAX_MESSAGE_SIZE = 1024 * 100; // 100KB max per WebSocket message
const MAX_TEXT_LENGTH = 50000;       // 50K chars max for chat text
const ALLOWED_TYPES = ['chat', 'abort', 'pong'];

function validateMessage(msg) {
    if (!msg || typeof msg !== 'object') return { valid: false, error: 'Message must be a JSON object' };
    if (!msg.type || !ALLOWED_TYPES.includes(msg.type)) return { valid: false, error: `Invalid message type: "${msg.type}"` };
    if (msg.type === 'chat') {
        if (typeof msg.text !== 'string') return { valid: false, error: 'Chat text must be a string' };
        if (msg.text.length > MAX_TEXT_LENGTH) return { valid: false, error: `Chat text exceeds ${MAX_TEXT_LENGTH} characters` };
    }
    return { valid: true };
}

// CPU load snapshot for differential measurement
let prevCpuTimes = null;

function calculateCpuLoad() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
        totalTick += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
        totalIdle += cpu.times.idle;
    }
    const idle = totalIdle / cpus.length;
    const tick = totalTick / cpus.length;

    if (prevCpuTimes) {
        const deltaIdle = idle - prevCpuTimes.idle;
        const deltaTick = tick - prevCpuTimes.tick;
        prevCpuTimes = { idle, tick };
        if (deltaTick === 0) return '0.0';
        return ((1 - deltaIdle / deltaTick) * 100).toFixed(1);
    }

    prevCpuTimes = { idle, tick };
    return '0.0'; // First call — return baseline, next call will be differential
}

class WebSocketHandler {
    handleConnection(ws) {
        agentService.setWebSocketClient(ws);
        let isAlive = true;

        ws.on('message', async (message) => {
            // Enforce message size limit
            if (Buffer.byteLength(message, 'utf-8') > MAX_MESSAGE_SIZE) {
                ws.send(JSON.stringify({ type: 'error', message: `Message exceeds ${MAX_MESSAGE_SIZE / 1024}KB limit` }));
                return;
            }
            try {
                const msg = JSON.parse(message);
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
                    const reply = await agentService.processUserMessage(msg.text);
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
                cpu: calculateCpuLoad(),
                ram: memUsage
            }));
        }, 5000);

        ws.on('close', () => {
            clearInterval(interval);
            isAlive = false;
        });

        ws.on('error', () => {
            clearInterval(interval);
            ws.terminate();
        });
    }
}

module.exports = new WebSocketHandler();
