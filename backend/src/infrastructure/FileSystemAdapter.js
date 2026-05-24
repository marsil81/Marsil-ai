const fs = require('fs/promises');
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

class FileSystemAdapter {
    async listDir(dirPath = '.') {
        const target = safePath(dirPath);
        try {
            const entries = await fs.readdir(target, { withFileTypes: true });
            const result = entries.map(e => ({
                name: e.name,
                isDirectory: e.isDirectory(),
            }));
            return JSON.stringify(result);
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    async readFileContent(filePath) {
        const target = safePath(filePath);
        try {
            return await fs.readFile(target, 'utf-8');
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    async writeFileContent(filePath, content) {
        const target = safePath(filePath);
        try {
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(target, content, 'utf-8');
            return `Successfully wrote to ${filePath}`;
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    async patchFile(filePath, searchStr, replaceStr) {
        const target = safePath(filePath);
        try {
            let content = await fs.readFile(target, 'utf-8');
            if (!content.includes(searchStr)) {
                return "Error: The exact search string was not found in the file.";
            }
            content = content.replace(searchStr, replaceStr);
            await fs.writeFile(target, content, 'utf-8');
            return `Successfully patched ${filePath}`;
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }
}

module.exports = new FileSystemAdapter();
