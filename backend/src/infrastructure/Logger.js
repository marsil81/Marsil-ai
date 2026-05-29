const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = {
    debug: '\x1b[90m',
    info:  '\x1b[36m',
    warn:  '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
};

const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

// ── In-Memory Circular Log Buffer ────────────────────────────────────────────
const MAX_BUFFER = 500;
const buffer = [];

function formatTimestamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level, message, meta) {
    if (LEVELS[level] < currentLevel) return;
    const color = COLORS[level] || '';
    const ts = formatTimestamp();
    let metaStr = '';
    try {
        metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    } catch {
        metaStr = ' [unserializable meta]';
    }
    const line = `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;

    // Push into circular buffer
    buffer.push({ ts, level, message, meta: meta || null });
    if (buffer.length > MAX_BUFFER) buffer.shift();

    if (level === 'error') {
        console.error(color + line + COLORS.reset);
    } else {
        console.log(color + line + COLORS.reset);
    }
}

module.exports = {
    debug: (msg, meta) => log('debug', msg, meta),
    info:  (msg, meta) => log('info', msg, meta),
    warn:  (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    /** Returns a copy of recent log entries (newest first) */
    getBuffer: (limit = 100) => buffer.slice(-limit).reverse(),
};
