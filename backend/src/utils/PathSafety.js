const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');

/**
 * Validates and sanitizes a relative path to prevent directory traversal attacks.
 * Denies any paths resolving outside of the workspace directory.
 * 
 * @param {string} relativePath 
 * @returns {string} The absolute safe path
 */
function safePath(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error('Invalid path: must be a non-empty string');
    }
    const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
    const resolvedLower = resolved.toLowerCase();
    const workspaceLower = WORKSPACE_ROOT.toLowerCase();
    
    if (!resolvedLower.startsWith(workspaceLower)) {
        throw new Error('Path traversal outside workspace denied');
    }
    return resolved;
}

module.exports = {
    safePath,
    WORKSPACE_ROOT
};
