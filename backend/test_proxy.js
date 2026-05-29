const fetch = require('node-fetch');

console.log("Testing local AnthropicProxy...");
fetch('http://127.0.0.1:3002/v1/messages', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-ant-dummy-key-for-local-proxy',
        'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Run a bash command to echo hello' }],
        max_tokens: 1024,
        tools: [{
            name: 'Bash',
            description: 'Run a bash command',
            input_schema: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'The command to run' }
                },
                required: ['command']
            }
        }],
        stream: true
    })
}).then(async res => {
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("RESPONSE:", text);
}).catch(err => {
    console.error("ERROR:", err.message);
});
