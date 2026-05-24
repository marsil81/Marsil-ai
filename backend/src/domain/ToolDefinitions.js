const AGENT_TOOLS = [
    {
        type: "function",
        function: {
            name: "listDir",
            description: "List contents of a directory in the workspace.",
            parameters: {
                type: "object",
                properties: {
                    dirPath: { type: "string", description: "Relative path to directory" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "readFileContent",
            description: "Read the content of a file.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string", description: "Relative path to file" }
                },
                required: ["filePath"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "writeFileContent",
            description: "Create or overwrite a file with content.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string", description: "Relative path to file" },
                    content: { type: "string", description: "The complete content to write" }
                },
                required: ["filePath", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "patchFile",
            description: "Replace a specific exact string in a file with another string. Useful for saving tokens instead of rewriting the whole file.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string", description: "Relative path to file" },
                    searchStr: { type: "string", description: "Exact string to search for" },
                    replaceStr: { type: "string", description: "The replacement string" }
                },
                required: ["filePath", "searchStr", "replaceStr"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "executeCommand",
            description: "Execute a shell command (PowerShell/CMD). The process output is returned.",
            parameters: {
                type: "object",
                properties: {
                    cmd: { type: "string", description: "The command to run" },
                    cwd: { type: "string", description: "The relative working directory" }
                },
                required: ["cmd"]
            }
        }
    }
];

module.exports = { AGENT_TOOLS };
