const { spawn } = require('child_process');
const path = require('path');

const WORKSPACE_DIR = path.resolve(__dirname, '../../..');

function safePath(relativePath) {
    const resolvedPath = path.resolve(WORKSPACE_DIR, relativePath);
    const resolvedLower = resolvedPath.toLowerCase();
    const workspaceLower = WORKSPACE_DIR.toLowerCase();
    if (!resolvedLower.startsWith(workspaceLower)) {
        throw new Error("Security Violation: Path traversal outside workspace denied.");
    }
    return resolvedPath;
}

class TerminalAdapter {
    constructor() {
        this.activeProcesses = new Map();
    }

    executeCommand(cmd, cwd = '.', wsClient) {
        return new Promise((resolve) => {
            let targetCwd;
            try {
                targetCwd = safePath(cwd);
            } catch (err) {
                return resolve(`Security Error: ${err.message}`);
            }

            const child = spawn(cmd, { shell: true, cwd: targetCwd });
            const pid = child.pid;
            
            if (pid) {
                this.activeProcesses.set(pid, child);
            }
            
            let output = '';

            child.stdout.on('data', (data) => {
                const str = data.toString();
                output += str;
                if (wsClient) {
                    wsClient.send(JSON.stringify({ type: 'terminal_output', data: str }));
                }
            });

            child.stderr.on('data', (data) => {
                const str = data.toString();
                output += str;
                if (wsClient) {
                    wsClient.send(JSON.stringify({ type: 'terminal_error', data: str }));
                }
            });

            child.on('error', (err) => {
                if (pid) {
                    this.activeProcesses.delete(pid);
                }
                if (wsClient) {
                    wsClient.send(JSON.stringify({ type: 'terminal_error', data: `Error executing: ${err.message}\n` }));
                }
                resolve(`Execution failed: ${err.message}`);
            });

            child.on('close', (code) => {
                if (pid) {
                    this.activeProcesses.delete(pid);
                }
                if (wsClient) {
                    wsClient.send(JSON.stringify({ type: 'terminal_exit', code }));
                }
                resolve(`Process exited with code ${code}.\nOutput:\n${output.slice(-2000)}`);
            });
        });
    }

    killAllProcesses() {
        for (const [pid, child] of this.activeProcesses.entries()) {
            try {
                child.kill('SIGKILL');
            } catch {}
            this.activeProcesses.delete(pid);
        }
        return "All terminal processes killed.";
    }
}

module.exports = new TerminalAdapter();
