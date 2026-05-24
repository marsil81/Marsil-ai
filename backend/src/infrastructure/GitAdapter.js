const { exec } = require('child_process');
const path = require('path');

const WORKSPACE_DIR = path.resolve(__dirname, '../../..');

class GitAdapter {
    checkpoint(message) {
        return new Promise((resolve) => {
            exec(`git add . && git commit -m "${message}"`, { cwd: WORKSPACE_DIR }, (error) => {
                if (error) {
                    resolve(`Git checkpoint skipped: ${error.message}`);
                } else {
                    resolve(`Git checkpoint created: ${message}`);
                }
            });
        });
    }

    revert() {
        return new Promise((resolve) => {
            exec(`git reset --hard HEAD~1`, { cwd: WORKSPACE_DIR }, (error) => {
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
