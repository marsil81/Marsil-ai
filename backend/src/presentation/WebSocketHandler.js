const os = require('os');
const agentService = require('../application/AgentService');

class WebSocketHandler {
    handleConnection(ws) {
        agentService.setWebSocketClient(ws);
        
        ws.on('message', async (message) => {
            const msg = JSON.parse(message);
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
        });

        const interval = setInterval(() => {
            const cpus = os.cpus();
            const load = cpus.reduce((acc, cpu) => acc + cpu.times.sys + cpu.times.user, 0) / cpus.length;
            const totalLoad = ((load / 10000) % 100).toFixed(1);
            
            const memFree = os.freemem();
            const memTotal = os.totalmem();
            const memUsage = (((memTotal - memFree) / memTotal) * 100).toFixed(1);
            
            ws.send(JSON.stringify({
                type: 'metrics',
                cpu: totalLoad,
                ram: memUsage
            }));
        }, 2000);

        ws.on('close', () => {
            clearInterval(interval);
        });
    }
}

module.exports = new WebSocketHandler();
