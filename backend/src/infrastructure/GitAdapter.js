const { execFile } = require('child_process');
const path = require('path');

const WORKSPACE_DIR = path.resolve(__dirname, '../../..');

class GitAdapter {
    checkpoint(message) {
        return new Promise((resolve) => {
            // Stage all files first using execFile (no shell) for security
            execFile('git', ['add', '.'], { cwd: WORKSPACE_DIR }, (addErr) => {
                if (addErr) {
                    resolve(`Git checkpoint skipped: ${addErr.message}`);
                    return;
                }
                execFile('git', ['commit', '--allow-empty', '-m', message], { cwd: WORKSPACE_DIR }, (error) => {
                    if (error) {
                        resolve(`Git checkpoint skipped: ${error.message}`);
                    } else {
                        resolve(`Git checkpoint created: ${message}`);
                    }
                });
            });
        });
    }

    revert() {
        return new Promise((resolve) => {
            execFile('git', ['reset', '--hard', 'HEAD~1'], { cwd: WORKSPACE_DIR }, (error) => {
                if (error) {
                    resolve(`Revert failed: ${error.message}`);
                } else {
                    resolve(`Successfully reverted to previous checkpoint.`);
                }
            });
        });
    }

    /**
     * Get git status (porcelain format, parsed into structured data)
     */
    status() {
        return new Promise((resolve) => {
            execFile('git', ['status', '--porcelain', '--branch'], { cwd: WORKSPACE_DIR, maxBuffer: 1024 * 1024 }, (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                const lines = stdout.split('\n').filter(Boolean);
                const branch = lines[0]?.replace('## ', '') || 'unknown';
                const changes = lines.slice(1).map(line => ({
                    status: line.substring(0, 2).trim(),
                    file: line.substring(3).trim()
                }));
                resolve({ branch, changes, total: changes.length });
            });
        });
    }

    /**
     * Get git diff (staged and unstaged)
     */
    diff() {
        return new Promise((resolve) => {
            execFile('git', ['diff', '--stat', '--no-color'], { cwd: WORKSPACE_DIR, maxBuffer: 1024 * 1024 }, (err, stat) => {
                if (err) {
                    resolve({ error: err.message });
                    return;
                }
                execFile('git', ['diff', '--no-color'], { cwd: WORKSPACE_DIR, maxBuffer: 1024 * 1024 }, (err2, diffContent) => {
                    if (err2) {
                        resolve({ error: err2.message });
                        return;
                    }
                    resolve({ stat: stat || 'No changes', diff: diffContent || '' });
                });
            });
        });
    }

    /**
     * Get recent commit log
     */
    log(count = 10) {
        return new Promise((resolve) => {
            execFile('git', ['log', `--max-count=${count}`, '--oneline', '--no-color'], { cwd: WORKSPACE_DIR }, (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                const commits = stdout.split('\n').filter(Boolean).map(line => {
                    const [hash, ...rest] = line.split(' ');
                    return { hash, message: rest.join(' ') };
                });
                resolve({ commits });
            });
        });
    }

    /**
     * List all local branches
     */
    branches() {
        return new Promise((resolve) => {
            execFile('git', ['branch', '--no-color'], { cwd: WORKSPACE_DIR }, (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                const branches = stdout.split('\n').filter(Boolean).map(line => ({
                    name: line.replace('* ', '').trim(),
                    current: line.startsWith('*'),
                }));
                resolve({ branches, current: branches.find(b => b.current)?.name || 'unknown' });
            });
        });
    }

    /**
     * Create and switch to a new branch
     */
    createBranch(branchName) {
        return new Promise((resolve) => {
            if (!branchName || typeof branchName !== 'string' || !/^[\w./-]+$/.test(branchName)) {
                resolve({ error: 'Invalid branch name' });
                return;
            }
            execFile('git', ['checkout', '-b', branchName], { cwd: WORKSPACE_DIR }, (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                resolve({ message: stdout.trim() || `Switched to new branch: ${branchName}` });
            });
        });
    }

    /**
     * Switch to an existing branch
     */
    switchBranch(branchName) {
        return new Promise((resolve) => {
            if (!branchName || typeof branchName !== 'string' || !/^[\w./-]+$/.test(branchName)) {
                resolve({ error: 'Invalid branch name' });
                return;
            }
            execFile('git', ['checkout', branchName], { cwd: WORKSPACE_DIR }, (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                resolve({ message: stdout.trim() || `Switched to branch: ${branchName}` });
            });
        });
    }
    /**
     * Delete a branch
     */
    deleteBranch(branchName) {
        return new Promise((resolve) => {
            if (!branchName || typeof branchName !== 'string' || !/^[\w./-]+$/.test(branchName)) {
                resolve({ error: 'Invalid branch name' });
                return;
            }
            execFile('git', ['branch', '-d', branchName], { cwd: WORKSPACE_DIR }, (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                resolve({ message: stdout.trim() || `Deleted branch: ${branchName}` });
            });
        });
    }
}

module.exports = new GitAdapter();
