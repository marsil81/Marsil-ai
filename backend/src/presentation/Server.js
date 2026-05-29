require('dotenv/config');
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
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const CONFIG_PATH = path.join(__dirname, '../../config.json');
const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');

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
        // Environment variables override config.json (safer for secrets)
        if (process.env.MARSIL_API_KEY) config.apiKey = process.env.MARSIL_API_KEY;
        if (process.env.MARSIL_PROVIDER) config.provider = process.env.MARSIL_PROVIDER;
        if (process.env.MARSIL_MODEL) config.model = process.env.MARSIL_MODEL;
        if (process.env.MARSIL_BASE_URL) config.baseUrl = process.env.MARSIL_BASE_URL;
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

// ── Path Safety ──────────────────────────────────────────────────────────────
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

// ── File Tree ────────────────────────────────────────────────────────────────
async function getFileTree(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
            const resPath = path.join(dir, entry.name);
            const rel = path.relative(WORKSPACE_ROOT, resPath);
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
    try { res.json(await getFileTree(WORKSPACE_ROOT)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// ── File Read / Write ────────────────────────────────────────────────────────
app.get('/api/file', async (req, res) => {
    try {
        const filePath = safePath(req.query.path);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/file', async (req, res) => {
    try {
        const filePath = safePath(req.body.path);
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

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    const config = await loadConfig();
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        claudeAvailable: claudeCode.isAvailable(),
        provider: config.provider,
        model: config.model
    });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error(`[Unhandled Error] ${req.method} ${req.path}:`, err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// ── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
    webSocketHandler.handleConnection(ws);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully...`);
    wss.clients.forEach((client) => {
        client.close(1001, 'Server shutting down');
    });
    anthropicProxy.stop();
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
    shutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason) => {
    console.error('[Unhandled Rejection]', reason);
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
