/**
 * 🛡️ MARSIL AI - Centralized Validation Helpers
 * ====================================================
 * Single source of truth for input safety and schema validation.
 * Shared between Server.js endpoints and test suites.
 */

const ALLOWED_PROVIDERS = ['anthropic', 'openai', 'deepseek', 'gemini', 'ollama'];
const MODEL_REGEX = /^[a-zA-Z0-9.:\-_/]+$/;

/**
 * Validates if the given provider is supported.
 * @param {string} provider 
 * @returns {boolean}
 */
function isValidProvider(provider) {
    return typeof provider === 'string' && ALLOWED_PROVIDERS.includes(provider.toLowerCase());
}

/**
 * Validates model name for safe shell arguments and safe configurations.
 * @param {string} model 
 * @returns {boolean}
 */
function isValidModelName(model) {
    if (!model || typeof model !== 'string' || model.length > 100) return false;
    return MODEL_REGEX.test(model);
}

/**
 * Validates if a baseUrl has a safe absolute URL schema (http/https only).
 * @param {string} urlStr 
 * @returns {boolean}
 */
function isValidBaseUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
        const parsed = new URL(urlStr);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Fix #2: Full SSRF protection — blocks all RFC1918, localhost, link-local, and IPv6 loopback.
 * Must be called in addition to isValidBaseUrl for any user-supplied baseUrl.
 * @param {string} urlStr 
 * @returns {{ safe: boolean, reason?: string }}
 */
function checkSsrfSafety(urlStr) {
    if (!isValidBaseUrl(urlStr)) return { safe: false, reason: 'Invalid URL format' };
    const hostname = new URL(urlStr).hostname;

    const BLOCKED_PATTERNS = [
        /^localhost$/i,
        /^127\./,                          // IPv4 loopback
        /^::1$/,                           // IPv6 loopback
        /^0\.0\.0\.0$/,                    // unspecified
        /^10\./,                           // RFC1918 class A
        /^172\.(1[6-9]|2\d|3[01])\./,     // RFC1918 class B
        /^192\.168\./,                     // RFC1918 class C
        /^169\.254\./,                     // link-local / AWS metadata
        /^fc00:/i,                         // IPv6 unique local
        /^fe80:/i,                         // IPv6 link-local
        /^::ffff:127\./,                   // IPv4-mapped loopback
    ];

    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(hostname)) {
            return { safe: false, reason: `Blocked internal/reserved address: ${hostname}` };
        }
    }
    return { safe: true };
}

/**
 * Validates rate limit or budget parameter.
 * @param {number} budget 
 * @returns {boolean}
 */
function isValidBudget(budget) {
    return typeof budget === 'number' && !isNaN(budget) && budget >= 0;
}

module.exports = {
    ALLOWED_PROVIDERS,
    MODEL_REGEX,
    isValidProvider,
    isValidModelName,
    isValidBaseUrl,
    checkSsrfSafety,
    isValidBudget
};
