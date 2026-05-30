/**
 * 🛡️ MARSIL AI - Secure AES-256-CBC Encryption Engine
 * ==================================================
 * Encrypts sensitive credentials on disk using a persistent machine secret.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../infrastructure/Logger');

const ALGORITHM = 'aes-256-cbc';
const SECRET_PATH = path.join(__dirname, '../../../.server_secret');

let ENCRYPTION_KEY = null;

function getEncryptionKey() {
    if (ENCRYPTION_KEY) return ENCRYPTION_KEY;

    // 1. Check environment variable override
    if (process.env.MARSIL_SECRET_KEY) {
        ENCRYPTION_KEY = crypto.scryptSync(process.env.MARSIL_SECRET_KEY, 'marsil-salt', 32);
        return ENCRYPTION_KEY;
    }

    // 2. Load or generate a persistent local secret key file
    try {
        if (fs.existsSync(SECRET_PATH)) {
            const hexKey = fs.readFileSync(SECRET_PATH, 'utf8').trim();
            ENCRYPTION_KEY = Buffer.from(hexKey, 'hex');
        } else {
            const randomKey = crypto.randomBytes(32);
            fs.writeFileSync(SECRET_PATH, randomKey.toString('hex'), 'utf8');
            ENCRYPTION_KEY = randomKey;
            logger.info('🛡️ Generated new secure encryption key for configuration storage.');
        }
    } catch (err) {
        logger.error('Failed to access secure encryption key file', { error: err.message });
        // Fallback to machine-specific salt so it doesn't crash but remains persistent
        ENCRYPTION_KEY = crypto.scryptSync(process.arch + process.platform + 'marsil-salt-fallback', 'salt', 32);
    }

    return ENCRYPTION_KEY;
}

/**
 * Encrypt plain text using AES-256-CBC
 * @param {string} text - Raw string
 * @returns {string} Encrypted text in format iv:encryptedHex
 */
function encrypt(text) {
    if (!text) return '';
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
        logger.error('Encryption failed', { error: err.message });
        return text;
    }
}

/**
 * Decrypt ciphertext using AES-256-CBC
 * @param {string} encryptedText - Encrypted string (iv:encryptedHex)
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';
    if (!encryptedText.includes(':')) return encryptedText; // Already decrypted or plain text

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encrypted = parts.join(':');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        logger.warn('Decryption failed, assuming plain text or key mismatch', { error: err.message });
        return encryptedText;
    }
}

module.exports = {
    encrypt,
    decrypt
};
