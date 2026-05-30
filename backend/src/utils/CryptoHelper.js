/**
 * 🛡️ MARSIL AI - Secure AES-256-GCM Encryption Engine
 * ==================================================
 * Encrypts sensitive credentials on disk using a persistent machine secret.
 * Automatically upgrades legacy AES-CBC keys transparently on the fly.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../infrastructure/Logger');

const ALGORITHM_GCM = 'aes-256-gcm';
const ALGORITHM_CBC = 'aes-256-cbc';

let ENCRYPTION_KEY = null;

/**
 * Returns standard OS system configuration directory path to isolate the secret key.
 * Prevents accidental backup, git commits, or replication of keys.
 */
function getSecretPath() {
    let baseDir;
    if (process.platform === 'win32') {
        baseDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    } else if (process.platform === 'darwin') {
        baseDir = path.join(os.homedir(), 'Library', 'Application Support');
    } else {
        baseDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    }
    
    const marsilDir = path.join(baseDir, 'Marsil');
    
    if (!fs.existsSync(marsilDir)) {
        try {
            fs.mkdirSync(marsilDir, { recursive: true });
        } catch (err) {
            // Fallback to project root if OS folders are absolutely read-only
            return path.join(__dirname, '../../../.server_secret');
        }
    }
    
    return path.join(marsilDir, '.server_secret');
}

function getEncryptionKey() {
    if (ENCRYPTION_KEY) return ENCRYPTION_KEY;

    // 1. Check environment variable override
    if (process.env.MARSIL_SECRET_KEY) {
        ENCRYPTION_KEY = crypto.scryptSync(process.env.MARSIL_SECRET_KEY, 'marsil-salt', 32);
        return ENCRYPTION_KEY;
    }

    // 2. Load or generate a persistent local secret key file inside safe system paths
    const secretPath = getSecretPath();
    try {
        if (fs.existsSync(secretPath)) {
            const hexKey = fs.readFileSync(secretPath, 'utf8').trim();
            ENCRYPTION_KEY = Buffer.from(hexKey, 'hex');
        } else {
            const randomKey = crypto.randomBytes(32);
            fs.writeFileSync(secretPath, randomKey.toString('hex'), 'utf8');
            ENCRYPTION_KEY = randomKey;
            logger.info(`🛡️ Generated new secure encryption key at: ${secretPath}`);
        }
    } catch (err) {
        // Fix #11: In production a missing key is a critical security failure — do NOT use a weak fallback.
        if (process.env.NODE_ENV === 'production') {
            logger.error('CRITICAL: Cannot load/generate encryption key in production! Refusing to start with a weak fallback. Please ensure write access to the app config directory or set MARSIL_SECRET_KEY env variable.');
            process.exit(1);
        }
        // In development only: fall back to a machine-specific key so dev iteration isn't blocked.
        logger.warn('DEV MODE: Using machine-specific fallback encryption key. Set MARSIL_SECRET_KEY for a stable dev key.');
        ENCRYPTION_KEY = crypto.scryptSync(process.arch + process.platform + 'marsil-dev-only-fallback', 'salt', 32);
    }

    return ENCRYPTION_KEY;
}

/**
 * Encrypt plain text using AES-256-GCM (AEAD)
 * @param {string} text - Raw string
 * @returns {string} Encrypted text in format ivHex:authTagHex:encryptedHex
 */
function encrypt(text) {
    if (!text) return '';
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(12); // Standard IV size for GCM is 12 bytes
        const cipher = crypto.createCipheriv(ALGORITHM_GCM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag(); // 16-byte authentication tag
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (err) {
        logger.error('GCM Encryption failed', { error: err.message });
        return text;
    }
}

/**
 * Decrypt ciphertext supporting legacy CBC and modern authenticated GCM modes
 * @param {string} encryptedText - Encrypted string
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';
    if (!encryptedText.includes(':')) return encryptedText; // Already decrypted or plain text

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        
        if (parts.length === 2) {
            // Backward Compatibility: Transparently decrypt legacy CBC format (ivHex:encryptedHex)
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const decipher = crypto.createDecipheriv(ALGORITHM_CBC, key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } else if (parts.length === 3) {
            // Modern AES-256-GCM authenticated format (ivHex:authTagHex:encryptedHex)
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            const decipher = crypto.createDecipheriv(ALGORITHM_GCM, key, iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        
        return encryptedText;
    } catch (err) {
        logger.warn('Decryption failed, assuming plain text or key mismatch', { error: err.message });
        return encryptedText;
    }
}

module.exports = {
    encrypt,
    decrypt,
    getSecretPath
};
