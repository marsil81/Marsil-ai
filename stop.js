const { exec } = require('child_process');

const PORTS = [3001, 5173, 5174];

console.log('⚡ Surgical Shutdown Sequence Initiated...');

function killPort(port) {
    return new Promise((resolve) => {
        const cmd = process.platform === 'win32'
            ? `netstat -ano | findstr :${port} | findstr LISTENING`
            : `lsof -i :${port} -t`;

        exec(cmd, (err, stdout) => {
            if (err || !stdout.trim()) {
                resolve();
                return;
            }

            const lines = stdout.trim().split('\n');
            const pids = new Set();

            for (const line of lines) {
                if (process.platform === 'win32') {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0') pids.add(pid);
                } else {
                    const pid = line.trim();
                    if (pid) pids.add(pid);
                }
            }

            const killPromises = Array.from(pids).map(pid => {
                return new Promise((res) => {
                    const killCmd = process.platform === 'win32' 
                        ? `taskkill /F /PID ${pid}` 
                        : `kill -9 ${pid}`;
                    exec(killCmd, (killErr) => {
                        if (!killErr) console.log(`✓ Terminated process ${pid} on port ${port}`);
                        res();
                    });
                });
            });

            Promise.all(killPromises).then(resolve);
        });
    });
}

Promise.all(PORTS.map(killPort)).then(() => {
    console.log('✓ Marsil AI systems are offline safely.');
    process.exit(0);
});
