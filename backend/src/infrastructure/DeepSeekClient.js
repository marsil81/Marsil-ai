const fetch = require('node-fetch');
const { AGENT_TOOLS } = require('../domain/ToolDefinitions');

class DeepSeekClient {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY || '';
        this.model = 'deepseek-chat';
        this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
    }

    setConfig(apiKey, model) {
        if (apiKey) this.apiKey = apiKey;
        if (model) this.model = model;
    }

    async getCompletion(history) {
        if (!this.apiKey) {
            throw new Error("Missing DeepSeek API Key.");
        }

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: history,
                tools: AGENT_TOOLS,
                tool_choice: "auto",
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        return { message: data.choices[0].message, usage };
    }
}

module.exports = new DeepSeekClient();
