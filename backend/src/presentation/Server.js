try { require('dotenv/config'); } catch { /* dotenv optional — fall back to env vars */ }
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs/promises');
const path = require('path');
const claudeCode = require('../infrastructure/ClaudeCodeAdapter');
const gitAdapter = require('../infrastructure/GitAdapter');
const webSocketHandler = require('./WebSocketHandler');
const anthropicProxy = require('../infrastructure/AnthropicProxy');
const logger = require('../infrastructure/Logger');

// ── Standardized Error Helper ─────────────────────────────────────────────────────
function apiError(res, status, code, message) {
    return res.status(status).json({ error: { code, message } });
}

const app = express();

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ── Request Logger ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
    });
    next();
});

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
        claudeCode.setProviderConfig(config);
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
        keyPrefix:      config.apiKey ? config.apiKey.slice(0, 3) + '•••' : '',
        claudeAvailable: claudeCode.isAvailable(),
        claudeVersion:  claudeCode.version || null
    });
});

// ── POST /api/config ─────────────────────────────────────────────────────────
app.post('/api/config', async (req, res) => {
    const body = req.body || {};
    if (body.provider && !['anthropic', 'openai', 'deepseek', 'gemini', 'ollama'].includes(body.provider)) {
        return res.status(400).json({ error: { code: 'INVALID_PROVIDER', message: `Invalid provider: "${body.provider}". Supported: anthropic, openai, deepseek, gemini, ollama` } });
    }
    if (body.budget !== undefined && (typeof body.budget !== 'number' || body.budget < 0)) {
        return res.status(400).json({ error: { code: 'INVALID_BUDGET', message: 'Budget must be a non-negative number' } });
    }
    const existing = await loadConfig();
    const newConfig = {
        provider: body.provider || existing.provider || 'anthropic',
        apiKey:   body.apiKey   || existing.apiKey   || '',
        model:    body.model    || existing.model    || 'claude-opus-4-5',
        baseUrl:  body.baseUrl  !== undefined ? body.baseUrl : existing.baseUrl,
        budget:   body.budget   !== undefined ? body.budget  : existing.budget || 0
    };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    claudeCode.setProviderConfig(newConfig);
    anthropicProxy.setTarget(newConfig.baseUrl, newConfig.apiKey, newConfig.model);
    logger.info('Configuration updated', { provider: newConfig.provider, model: newConfig.model });
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
    catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

// ── File Read / Write ────────────────────────────────────────────────────────
app.get('/api/file', async (req, res) => {
    try {
        const filePath = safePath(req.query.path);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

app.post('/api/file', async (req, res) => {
    try {
        const filePath = safePath(req.body.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, req.body.content || '', 'utf-8');
        res.json({ success: true });
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

// ── File Delete ────────────────────────────────────────────────────────────────
app.delete('/api/file', async (req, res) => {
    try {
        const filePath = safePath(req.query.path);
        await fs.unlink(filePath);
        res.json({ success: true });
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

// ── File Rename ────────────────────────────────────────────────────────────────
app.post('/api/file/rename', async (req, res) => {
    try {
        const oldPath = safePath(req.body.oldPath);
        const newPath = safePath(req.body.newPath);
        await fs.rename(oldPath, newPath);
        res.json({ success: true });
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

// ── Git Operations ────────────────────────────────────────────────────────────
app.post('/api/revert', async (req, res) => {
    const result = await gitAdapter.revert();
    res.json({ message: result });
});

app.get('/api/git/status', async (req, res) => {
    try {
        const result = await gitAdapter.status();
        res.json(result);
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

app.get('/api/git/diff', async (req, res) => {
    try {
        const result = await gitAdapter.diff();
        res.json(result);
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

app.get('/api/git/log', async (req, res) => {
    try {
        const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 50);
        const result = await gitAdapter.log(count);
        res.json(result);
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

// ── Git Branch Operations ──────────────────────────────────────────────────────
app.get('/api/git/branches', async (req, res) => {
    try {
        const result = await gitAdapter.branches();
        res.json(result);
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
});

app.post('/api/git/branch', async (req, res) => {
    try {
        const { name, action } = req.body || {};
        if (action === 'switch') {
            const result = await gitAdapter.switchBranch(name);
            res.json(result);
        } else {
            const result = await gitAdapter.createBranch(name);
            res.json(result);
        }
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
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

// ── GET /api/proxy/status ──────────────────────────────────────────────────────
app.get('/api/proxy/status', async (req, res) => {
    const config = await loadConfig();
    const proxyRunning = anthropicProxy.isRunning ? anthropicProxy.isRunning() : false;
    res.json({
        proxyRunning,
        proxyPort: 3002,
        provider: config.provider,
        model: config.model,
        hasKey: !!config.apiKey,
        keyValid: config.apiKey ? config.apiKey.length > 10 : false,
        claudeAvailable: claudeCode.isAvailable(),
    });
});

// ── GET /api/logs ─────────────────────────────────────────────────────────────
app.get('/api/logs', async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 500);
    res.json({ logs: logger.getBuffer(limit) });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    logger.error(`Unhandled error on ${req.method} ${req.path}`, { message: err.message });
    apiError(res, err.status || 500, 'UNHANDLED_ERROR', err.message || 'Internal Server Error');
});

// ── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
    webSocketHandler.handleConnection(ws);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully...`);
    wss.clients.forEach((client) => {
        client.close(1001, 'Server shutting down');
    });
    anthropicProxy.stop();
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message, stack: err.stack });
    shutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { message: reason?.message || String(reason) });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await loadConfig();
    try {
        await anthropicProxy.start(3002);
    } catch (err) {
        logger.error('Failed to start local Anthropic-to-OpenAI proxy on port 3002', { message: err.message });
    }
    const status = claudeCode.isAvailable()
        ? `Claude Code ${claudeCode.version} ✓`
        : `Claude Code NOT FOUND — install with: npm i -g @anthropic-ai/claude-code`;
    logger.info(`Marsil Backend → http://localhost:${PORT}`);
    logger.info(`Engine: ${status}`);
});
