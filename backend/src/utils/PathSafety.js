const path = require('path');
const fs = require('fs');

/**
 * Fix #3: WORKSPACE_ROOT is configurable via MARSIL_WORKSPACE_ROOT env variable.
 * Falls back to process.cwd() (the directory from which the server is launched)
 * instead of a fragile relative path from __dirname that breaks if file is moved.
 */
const WORKSPACE_ROOT = process.env.MARSIL_WORKSPACE_ROOT
    ? path.resolve(process.env.MARSIL_WORKSPACE_ROOT)
    : path.resolve(process.cwd());

/**
 * Validates and sanitizes a relative path to prevent directory traversal and symlink attacks.
 * Denies any paths resolving outside of the workspace directory.
 * 
 * @param {string} relativePath 
 * @returns {string} The absolute safe path
 */
function safePath(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error('Invalid path: must be a non-empty string');
    }
    
    // 1. Resolve standard absolute path
    const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
    
    // 2. Resolve the real path of the workspace root (unveiling symbolic links)
    const realWorkspaceRoot = fs.existsSync(WORKSPACE_ROOT) 
        ? fs.realpathSync(WORKSPACE_ROOT) 
        : WORKSPACE_ROOT;
        
    // 3. Resolve the real path of the target or its closest existing parent directory
    let realTarget = resolved;
    if (fs.existsSync(resolved)) {
        realTarget = fs.realpathSync(resolved);
    } else {
        let current = path.dirname(resolved);
        while (current && current !== path.dirname(current)) {
            if (fs.existsSync(current)) {
                const realParent = fs.realpathSync(current);
                realTarget = path.join(realParent, path.relative(current, resolved));
                break;
            }
            current = path.dirname(current);
        }
    }
    
    // 4. Enforce strict prefix checking on real paths
    const targetLower = realTarget.toLowerCase();
    const workspaceLower = realWorkspaceRoot.toLowerCase();
    
    if (!targetLower.startsWith(workspaceLower)) {
        throw new Error('Path traversal outside workspace denied');
    }
    
    return resolved;
}

module.exports = {
    safePath,
    WORKSPACE_ROOT
};
