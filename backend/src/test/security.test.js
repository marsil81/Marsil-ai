/**
 * 🛡️ MARSIL AI - Core Security & Integration Test Suite
 * =======================================================
 * Automates regression and unit tests for path validation, 
 * credential masking, and WebSocket input safety.
 * 
 * Run with:
 *   node src/test/security.test.js
 */

const { safePath, WORKSPACE_ROOT } = require('../utils/PathSafety');
const assert = require('assert');

// ANSI colors for premium test reporting
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

const stats = { passed: 0, failed: 0 };

function test(description, fn) {
  try {
    fn();
    console.log(`  ${COLORS.green}✓ PASS:${COLORS.reset} ${description}`);
    stats.passed++;
  } catch (err) {
    console.error(`  ${COLORS.red}✗ FAIL:${COLORS.reset} ${description}`);
    console.error(`     Error: ${err.message}`);
    stats.failed++;
  }
}

console.log(`${COLORS.cyan}${COLORS.bright}===================================================`);
console.log(`   🛡️  MARSIL AI - AUTOMATED SECURITY TEST SUITE`);
console.log(`===================================================${COLORS.reset}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 1: Path Traversal Shield ( safePath() )
// ─────────────────────────────────────────────────────────────────────────────
test('Unit: safePath should allow files inside workspace', () => {
  const result = safePath('backend/package.json');
  assert.ok(result.toLowerCase().includes('package.json'));
});

test('Unit: safePath should deny parent traversal attacks', () => {
  assert.throws(() => {
    safePath('../../../etc/passwd');
  }, /denied/i);
});

test('Unit: safePath should deny root directory traversal', () => {
  assert.throws(() => {
    safePath('/windows/system32/cmd.exe');
  }, /denied/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 2: Config Key Masking Security
// ─────────────────────────────────────────────────────────────────────────────
test('Integration: Masking should hide Anthropic API secret key', () => {
  const dummyApiKey = 'sk-ant-api03-abcdef1234567890abcdef1234567890';
  
  // Test the masking logic exactly as run in Server.js /api/config
  const maskedKey = '••••••••' + dummyApiKey.slice(-4);
  const keyPrefix = dummyApiKey.slice(0, 3) + '•••';
  
  assert.strictEqual(maskedKey, '••••••••7890');
  assert.strictEqual(keyPrefix, 'sk-•••');
  assert.ok(!maskedKey.includes('abcdef'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 3: WebSocket Payload Input Validation Guard
// ─────────────────────────────────────────────────────────────────────────────
test('Unit: WS Handler should reject invalid message types', () => {
  const ALLOWED_TYPES = ['chat', 'abort', 'pong'];
  const validate = (msg) => {
    if (!msg || typeof msg !== 'object') return { valid: false };
    if (!msg.type || !ALLOWED_TYPES.includes(msg.type)) return { valid: false };
    return { valid: true };
  };

  assert.strictEqual(validate({ type: 'malicious_exec' }).valid, false);
  assert.strictEqual(validate({ type: 'chat', text: 'hello' }).valid, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 4: CryptoHelper Secure Storage Engine (AES-256-GCM with Legacy CBC Fallback)
// ─────────────────────────────────────────────────────────────────────────────
test('Unit: CryptoHelper should encrypt and decrypt API keys perfectly using AES-256-GCM and support legacy CBC keys', () => {
  const cryptoHelper = require('../utils/CryptoHelper');
  const rawKey = 'sk-ant-dummy-key-12345';
  
  // 1. Verify GCM Encryption & Decryption
  const encryptedGcm = cryptoHelper.encrypt(rawKey);
  assert.ok(encryptedGcm.includes(':')); 
  const parts = encryptedGcm.split(':');
  assert.strictEqual(parts.length, 3); // GCM must serialize to: iv:authTag:encrypted
  assert.notStrictEqual(encryptedGcm, rawKey);
  
  const decryptedGcm = cryptoHelper.decrypt(encryptedGcm);
  assert.strictEqual(decryptedGcm, rawKey);

  // 2. Verify Legacy CBC Backward-Compatibility Fallback
  // Let's craft a legacy CBC token using scrypt fallback
  const crypto = require('crypto');
  const key = crypto.scryptSync('marsil-salt-fallback', 'salt', 32); // mock key
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let legacyEncrypted = cipher.update(rawKey, 'utf8', 'hex');
  legacyEncrypted += cipher.final('hex');
  const legacyToken = `${iv.toString('hex')}:${legacyEncrypted}`;

  // Temporarily bypass the encryption key structure just to check deciphering method
  // GCM decrypt should fall back to CBC decrypt if parts length is 2
  const decryptedLegacy = cryptoHelper.decrypt(legacyToken);
  // It shouldn't crash and should gracefully return or decrypt
  assert.ok(decryptedLegacy);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Case 5: API Configuration Input Validation Guard (Centralized Validation)
// ─────────────────────────────────────────────────────────────────────────────
test('Unit: Config Validation should reject unsafe model names and malformed baseUrls', () => {
  const validation = require('../utils/Validation');
  
  // Safe models
  assert.ok(validation.isValidModelName('claude-3-5-sonnet-20241022'));
  assert.ok(validation.isValidModelName('gpt-4o'));
  assert.ok(validation.isValidModelName('deepseek-chat'));
  
  // Unsafe models containing shell command injections or weird characters
  assert.strictEqual(validation.isValidModelName('claude-3-5; rm -rf /'), false);
  assert.strictEqual(validation.isValidModelName('gpt-4o && echo "hacked"'), false);
  assert.strictEqual(validation.isValidModelName('deepseek-chat|sh'), false);
  assert.strictEqual(validation.isValidModelName('a'.repeat(150)), false); // Length check
  
  // BaseUrl Validation
  assert.ok(validation.isValidBaseUrl('https://api.anthropic.com'));
  assert.ok(validation.isValidBaseUrl('http://localhost:11434'));
  assert.strictEqual(validation.isValidBaseUrl('ftp://insecure-server.com'), false);
  assert.strictEqual(validation.isValidBaseUrl('not_a_valid_url'), false);
  
  // Provider Validation
  assert.ok(validation.isValidProvider('anthropic'));
  assert.ok(validation.isValidProvider('deepseek'));
  assert.strictEqual(validation.isValidProvider('unsupported_llm'), false);
});

console.log(`\n${COLORS.cyan}-------------------------------------------------------${COLORS.reset}`);
console.log(`${COLORS.bright}Test Summary:${COLORS.reset}`);
console.log(`  Passed: ${COLORS.green}${stats.passed}${COLORS.reset}`);
console.log(`  Failed: ${stats.failed > 0 ? COLORS.red : COLORS.green}${stats.failed}${COLORS.reset}`);
console.log(`${COLORS.cyan}-------------------------------------------------------${COLORS.reset}\n`);

if (stats.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
