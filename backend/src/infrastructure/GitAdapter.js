const { execFile, exec } = require('child_process');
const path = require('path');
const logger = require('./Logger');

const WORKSPACE_DIR = path.resolve(__dirname, '../../..');

class GitAdapter {
    checkpoint(message) {
        return new Promise((resolve) => {
            // Stage all files first
            exec('git add .', { cwd: WORKSPACE_DIR }, (addErr) => {
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
}

module.exports = new GitAdapter();
