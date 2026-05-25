const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const claudeCode = require('../infrastructure/ClaudeCodeAdapter');
const gitAdapter = require('../infrastructure/GitAdapter');
const agentService = require('../application/AgentService');
const webSocketHandler = require('./WebSocketHandler');
const anthropicProxy = require('../infrastructure/AnthropicProxy');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const CONFIG_PATH = path.join(__dirname, '../../config.json');

// Default config shape — provider-based, no more "engine" toggle
const DEFAULT_CONFIG = {
    provider: 'anthropic',
    apiKey:   '',
    model:    'claude-opus-4-5',
    baseUrl:  null,
    budget:   0  // max USD budget per session (0 = unlimited)
};

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        const config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
        claudeCode.setProviderConfig(config);
        anthropicProxy.setTarget(config.baseUrl, config.apiKey, config.model);
        return config;
    } catch {
        const config = { ...DEFAULT_CONFIG };
        anthropicProxy.setTarget(config.baseUrl, config.apiKey, config.model);
        return config;
    }
}

// ── GET /api/config ──────────────────────────────────────────────────────────
app.get('/api/config', async (req, res) => {
    const config = await loadConfig();
    res.json({
        provider:       config.provider,
        model:          config.model,
        baseUrl:        config.baseUrl,
        budget:         config.budget,
        hasKey:         !!config.apiKey,
        maskedKey:      config.apiKey ? '••••••••' + config.apiKey.slice(-4) : '',
        claudeAvailable: claudeCode.isAvailable(),
        claudeVersion:  claudeCode.version || null
    });
});

// ── POST /api/config ─────────────────────────────────────────────────────────
app.post('/api/config', async (req, res) => {
    const existing = await loadConfig();
    const { provider, apiKey, model, baseUrl, budget } = req.body;
    const newConfig = {
        provider: provider || existing.provider || 'anthropic',
        apiKey:   apiKey   || existing.apiKey   || '',
        model:    model    || existing.model    || 'claude-opus-4-5',
        baseUrl:  baseUrl  !== undefined ? baseUrl : existing.baseUrl,
        budget:   budget   !== undefined ? budget  : existing.budget || 0
    };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    claudeCode.setProviderConfig(newConfig);
    anthropicProxy.setTarget(newConfig.baseUrl, newConfig.apiKey, newConfig.model);
    res.json({ success: true });
});

// ── GET /api/status ──────────────────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
    const config = await loadConfig();
    res.json({
        claudeAvailable: claudeCode.isAvailable(),
        claudeVersion:   claudeCode.version || null,
        provider:        config.provider,
        model:           config.model,
        ready:           claudeCode.isAvailable() && !!config.apiKey
    });
});

// ── File Tree ────────────────────────────────────────────────────────────────
async function getFileTree(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
            const resPath = path.join(dir, entry.name);
            const rel = path.relative(path.join(__dirname, '../../..'), resPath);
            if (entry.isDirectory()) {
                try {
                    files.push({ name: entry.name, path: rel, isDirectory: true, children: await getFileTree(resPath) });
                } catch {
                    files.push({ name: entry.name, path: rel, isDirectory: true, children: [] });
                }
            } else {
                files.push({ name: entry.name, path: rel, isDirectory: false });
            }
        }
        return files;
    } catch { return []; }
}

app.get('/api/files', async (req, res) => {
    try { res.json(await getFileTree(path.join(__dirname, '../../..'))); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// ── File Read / Write ────────────────────────────────────────────────────────
app.get('/api/file', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../../..', req.query.path);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/file', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../../..', req.body.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, req.body.content || '', 'utf-8');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Git Revert ───────────────────────────────────────────────────────────────
app.post('/api/revert', async (req, res) => {
    const result = await gitAdapter.revert();
    res.json({ message: result });
});

// ── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
    webSocketHandler.handleConnection(ws);
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await loadConfig();
    try {
        await anthropicProxy.start(3002);
    } catch (err) {
        console.error('Failed to start local Anthropic-to-OpenAI proxy on port 3002:', err.message);
    }
    const status = claudeCode.isAvailable()
        ? `Claude Code ${claudeCode.version} ✓`
        : `Claude Code NOT FOUND — install with: npm i -g @anthropic-ai/claude-code`;
    console.log(`Marsil Backend  →  http://localhost:${PORT}`);
    console.log(`Engine: ${status}`);
});
