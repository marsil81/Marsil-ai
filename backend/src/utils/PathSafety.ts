import * as path from 'path';

export const WORKSPACE_ROOT: string = path.resolve(__dirname, '../../..');

/**
 * Validates and sanitizes a relative path to prevent directory traversal attacks.
 * Denies any paths resolving outside of the workspace directory.
 * 
 * @param relativePath - The requested relative path
 * @returns The absolute safe path
 */
export function safePath(relativePath: string): string {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error('Invalid path: must be a non-empty string');
    }
    const resolved: string = path.resolve(WORKSPACE_ROOT, relativePath);
    const resolvedLower: string = resolved.toLowerCase();
    const workspaceLower: string = WORKSPACE_ROOT.toLowerCase();
    
    if (!resolvedLower.startsWith(workspaceLower)) {
        throw new Error('Path traversal outside workspace denied');
    }
    return resolved;
}
