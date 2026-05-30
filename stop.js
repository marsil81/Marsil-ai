const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORTS = [3001, 3002, 5173, 5174];
const pidPath = path.join(__dirname, '.marsil.pid');

console.log('⚡ Surgical Shutdown Sequence Initiated...');

function killProcess(pid, context = '') {
    return new Promise((resolve) => {
        const killCmd = process.platform === 'win32'
            ? `taskkill /F /PID ${pid} /T` // /T kills child processes as well!
            : `kill -9 ${pid}`;

        exec(killCmd, (err) => {
            if (!err) {
                console.log(`✓ Surgically terminated Marsil process ${pid} ${context}`);
            }
            resolve();
        });
    });
}

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

            const killPromises = Array.from(pids).map(pid => killProcess(pid, `on port ${port}`));
            Promise.all(killPromises).then(resolve);
        });
    });
}

async function runShutdown() {
    // 1. Try to kill the surgical PID first
    if (fs.existsSync(pidPath)) {
        try {
            const pid = fs.readFileSync(pidPath, 'utf8').trim();
            if (pid) {
                console.log(`📡 Detected active process PID: ${pid}. Killing surgically...`);
                await killProcess(pid, '(active backend)');
                try { fs.unlinkSync(pidPath); } catch {}
            }
        } catch (e) {
            console.error('Failed to read or kill PID:', e.message);
        }
    }

    // 2. Run port-based fallback shutdown to clean up any orphaned dev/proxy servers
    console.log('🧹 Cleaning up any leftover ports...');
    await Promise.all(PORTS.map(killPort));

    console.log('✓ Marsil AI systems are offline safely.');
    process.exit(0);
}

runShutdown();
