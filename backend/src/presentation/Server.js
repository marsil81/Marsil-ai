try { require('dotenv/config'); } catch { /* dotenv optional — fall back to env vars */ }
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const claudeCode = require('../infrastructure/ClaudeCodeAdapter');
const gitAdapter = require('../infrastructure/GitAdapter');
const webSocketHandler = require('./WebSocketHandler');
const anthropicProxy = require('../infrastructure/AnthropicProxy');
const logger = require('../infrastructure/Logger');
const { safePath, WORKSPACE_ROOT } = require('../utils/PathSafety');
const cryptoHelper = require('../utils/CryptoHelper');
const validation = require('../utils/Validation');

// ── Standardized Error Helper ─────────────────────────────────────────────────────
function apiError(res, status, code, message) {
    return res.status(status).json({ error: { code, message } });
}

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// ── Security Middleware ─────────────────────────────────────────────────────
// Enable strong Content Security Policy (CSP) in production, leaving it flexible in development (3.1)
app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "ws://127.0.0.1:*", "wss://127.0.0.1:*", "ws://localhost:*", "wss://localhost:*", "http://127.0.0.1:*", "https://api.anthropic.com", "https://api.openai.com", "https://api.deepseek.com", "https://generativelanguage.googleapis.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        }
    } : false,
    crossOriginEmbedderPolicy: false,
}));

// Restrict CORS origins strictly to loopback interfaces in production for security hardening (3.2)
const allowedOrigins = isProduction
    ? ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002']
    : (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:3001', 'http://127.0.0.1:3001']);

app.use(cors({
    origin: allowedOrigins,
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

// Serve compiled static frontend assets in production if available
const PUBLIC_DIR = path.join(__dirname, '../public');
app.use(express.static(PUBLIC_DIR));

const fsSync = require('fs');
const https = require('https');

let server;
const sslKeyPath = path.join(__dirname, '../../ssl/key.pem');
const sslCertPath = path.join(__dirname, '../../ssl/cert.pem');

if (fsSync.existsSync(sslKeyPath) && fsSync.existsSync(sslCertPath)) {
    try {
        const sslOptions = {
            key: fsSync.readFileSync(sslKeyPath),
            cert: fsSync.readFileSync(sslCertPath)
        };
        server = https.createServer(sslOptions, app);
        logger.info('🛡️ SSL Certificate detected. Running in secure HTTPS/WSS mode.');
    } catch (err) {
        if (isProduction) {
            logger.error('🚨 CRITICAL ERROR: SSL/TLS initialization failed in PRODUCTION mode. Refusing to boot insecurely!', { message: err.message });
            process.exit(1);
        } else {
            logger.error('Failed to start secure HTTPS server, falling back to HTTP in DEVELOPMENT mode', { message: err.message });
            server = http.createServer(app);
        }
    }
} else {
    if (isProduction) {
        logger.error('🚨 CRITICAL ERROR: SSL/TLS certificate files (key.pem, cert.pem) are missing in PRODUCTION. Mandatory wss:// is required. Boot aborted!');
        process.exit(1);
    } else {
        logger.warn('⚠️ Running in INSECURE HTTP mode (development only). Secure wss:// is highly recommended for production.');
        server = http.createServer(app);
    }
}

const wss = new WebSocket.Server({ server });

const CONFIG_PATH = path.join(__dirname, '../../config.json');

// Default config shape — provider-based, no more "engine" toggle
const DEFAULT_CONFIG = {
    provider: 'anthropic',
    apiKey:   '',
    model:    'claude-opus-4-5',
    baseUrl:  null,
    budget:   0,  // max USD budget per session (0 = unlimited)
    demoMode: false
};

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.apiKey) {
            parsed.apiKey = cryptoHelper.decrypt(parsed.apiKey);
        }
        const config = { ...DEFAULT_CONFIG, ...parsed };
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
        demoMode:       !!config.demoMode,
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
    
    // ── Centralized Input Validation & SSRF Prevention ─────────────────────────────
    if (body.provider && !validation.isValidProvider(body.provider)) {
        return res.status(400).json({ error: { code: 'INVALID_PROVIDER', message: `Invalid provider: "${body.provider}". Supported: anthropic, openai, deepseek, gemini, ollama` } });
    }
    if (body.budget !== undefined && !validation.isValidBudget(body.budget)) {
        return res.status(400).json({ error: { code: 'INVALID_BUDGET', message: 'Budget must be a non-negative number' } });
    }
    if (body.baseUrl) {
        if (!validation.isValidBaseUrl(body.baseUrl)) {
            return res.status(400).json({ error: { code: 'INVALID_BASE_URL', message: 'Base URL must be a valid absolute URL (http/https)' } });
        }
        // Fix #2: Full RFC1918 + loopback SSRF protection
        const ssrf = validation.checkSsrfSafety(body.baseUrl);
        if (!ssrf.safe) {
            return res.status(400).json({ error: { code: 'SSRF_BLOCKED', message: `URL blocked: ${ssrf.reason}` } });
        }
    }
    if (body.model && !validation.isValidModelName(body.model)) {
        return res.status(400).json({ error: { code: 'INVALID_MODEL', message: 'Model name contains invalid or unsafe characters' } });
    }

    const existing = await loadConfig();
    const newConfig = {
        provider: body.provider || existing.provider || 'anthropic',
        apiKey:   body.apiKey !== undefined ? body.apiKey : existing.apiKey || '',
        model:    body.model    || existing.model    || 'claude-opus-4-5',
        baseUrl:  body.baseUrl  !== undefined ? body.baseUrl : existing.baseUrl,
        budget:   body.budget   !== undefined ? body.budget  : existing.budget || 0,
        demoMode: body.demoMode !== undefined ? !!body.demoMode : existing.demoMode || false
    };

    // Serialize to disk with AES encrypted API key for security hardening
    const serializedConfig = {
        ...newConfig,
        apiKey: newConfig.apiKey ? cryptoHelper.encrypt(newConfig.apiKey) : ''
    };

    const tmpPath = `${CONFIG_PATH}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(serializedConfig, null, 2));
    await fs.rename(tmpPath, CONFIG_PATH);

    // Keep decrypted config in memory for running proxy & adapter threads
    claudeCode.setProviderConfig(newConfig);
    anthropicProxy.setTarget(newConfig.baseUrl, newConfig.apiKey, newConfig.model);
    logger.info('Configuration updated and saved securely', { provider: newConfig.provider, model: newConfig.model, demoMode: newConfig.demoMode });
    res.json({ success: true });
});

// ── GET /api/status ──────────────────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
    const config = await loadConfig();
    res.json({
        claudeAvailable: claudeCode.isAvailable() || config.demoMode,
        claudeVersion:   claudeCode.version || "marsil-demo-v1.0.0",
        provider:        config.provider,
        model:           config.model,
        demoMode:        config.demoMode,
        ready:           (claudeCode.isAvailable() && !!config.apiKey) || config.demoMode
    });
});

// ── File Tree with Caching ─────────────────────────────────────────────────────
const fileTreeCache = { data: null, timestamp: 0 };
const FILE_TREE_TTL = 3000; // 3 seconds cache TTL

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
    const now = Date.now();
    if (fileTreeCache.data && (now - fileTreeCache.timestamp) < FILE_TREE_TTL) {
      return res.json(fileTreeCache.data);
    }
    try {
      const data = await getFileTree(WORKSPACE_ROOT);
      fileTreeCache.data = data;
      fileTreeCache.timestamp = now;
      res.json(data);
    } catch (err) { apiError(res, 500, 'INTERNAL_ERROR', err.message); }
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
        } else if (action === 'delete') {
            const result = await gitAdapter.deleteBranch(name);
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

// ── GET /api/metrics ────────────────────────────────────────────────────────────
app.get('/api/metrics', async (req, res) => {
    const memFree = os.freemem();
    const memTotal = os.totalmem();
    const memUsage = (((memTotal - memFree) / memTotal) * 100).toFixed(1);
    res.json({
        cpu: logger.calculateCpuLoad(),
        ram: memUsage,
        uptime: process.uptime(),
        timestamp: Date.now(),
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
wss.on('connection', (ws, req) => {
    webSocketHandler.handleConnection(ws, req);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully...`);
    wss.clients.forEach((client) => {
        client.close(1001, 'Server shutting down');
    });
    anthropicProxy.stop();
    
    try {
        const fsSync = require('fs');
        const pidPath = path.join(__dirname, '../../.marsil.pid');
        if (fsSync.existsSync(pidPath)) {
            fsSync.unlinkSync(pidPath);
        }
    } catch {}

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

// ── Start & Exports ──────────────────────────────────────────────────────────
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || '127.0.0.1'; // Enforce loopback binding for security hardening (5.2)
    server.listen(PORT, HOST, async () => {
        await loadConfig();
        
        // Write surgical PID file to avoid generic port-killing issues
        try {
            const pidPath = path.join(__dirname, '../../.marsil.pid');
            await fs.writeFile(pidPath, String(process.pid));
        } catch (err) {
            logger.error('Failed to write PID file:', { message: err.message });
        }

        try {
            await anthropicProxy.start(3002);
        } catch (err) {
            logger.error('Failed to start local Anthropic-to-OpenAI proxy on port 3002', { message: err.message });
        }
        const status = claudeCode.isAvailable()
            ? `Claude Code ${claudeCode.version} ✓`
            : `Claude Code NOT FOUND — install with: npm i -g @anthropic-ai/claude-code`;
        logger.info(`Marsil Backend → http://${HOST}:${PORT}`);
        logger.info(`Engine: ${status}`);
    });
}

module.exports = { app, server, loadConfig };
