const os = require('os');
const agentService = require('../application/AgentService');

// CPU load snapshot for differential measurement
let prevCpuTimes = null;

function calculateCpuLoad() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
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
    return ((1 - idle / tick) * 100).toFixed(1);
}

class WebSocketHandler {
    handleConnection(ws) {
        agentService.setWebSocketClient(ws);
        let isAlive = true;

        ws.on('message', async (message) => {
            try {
                const msg = JSON.parse(message);
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
                }
            } catch {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
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
