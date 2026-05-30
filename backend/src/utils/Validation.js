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
    isValidBudget
};
