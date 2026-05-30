/**
 * 🌐 MARSIL AI - API REST Integration Test Suite
 * ====================================================
 * Automatically spins up the real secure Express server instance,
 * hits primary API endpoints, and validates live JSON schemas.
 * 
 * Run with:
 *   node src/test/integration.test.js
 */

const assert = require('assert');
const http = require('http');
const { app, loadConfig } = require('../presentation/Server');

// ANSI Colors
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
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
console.log(`   🌐  MARSIL AI - API INTEGRATION TEST SUITE`);
console.log(`===================================================${COLORS.reset}\n`);

// Run the real server on high port 3099 for testing
const TEST_PORT = 3099;
const testServer = http.createServer(app);

testServer.listen(TEST_PORT, async () => {
  // Initialize real config before running requests
  await loadConfig();
  
  const get = (path) => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${TEST_PORT}${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            reject(new Error(`Failed to parse JSON response from ${path}: ${data}`));
          }
        });
      }).on('error', reject);
    });
  };

  async function runSuite() {
    try {
      // Test 1: Real Health Endpoint Check
      const healthRes = await get('/api/health');
      test('GET /api/health should return status 200 and real app payload', () => {
        assert.strictEqual(healthRes.status, 200);
        assert.strictEqual(healthRes.body.status, 'ok');
        assert.ok(typeof healthRes.body.uptime === 'number');
        assert.ok(healthRes.body.timestamp > 0);
      });

      // Test 2: Real Engine Proxy Status Check
      const proxyStatusRes = await get('/api/proxy/status');
      test('GET /api/proxy/status should report live target model and port config', () => {
        assert.strictEqual(proxyStatusRes.status, 200);
        assert.strictEqual(proxyStatusRes.body.proxyPort, 3002);
        assert.ok(typeof proxyStatusRes.body.provider === 'string');
        assert.ok(typeof proxyStatusRes.body.model === 'string');
      });

      // Test 3: Real System Metrics Feed
      const metricsRes = await get('/api/metrics');
      test('GET /api/metrics should supply live CPU and RAM percentages', () => {
        assert.strictEqual(metricsRes.status, 200);
        assert.ok(parseFloat(metricsRes.body.cpu) >= 0);
        assert.ok(parseFloat(metricsRes.body.ram) >= 0);
        assert.ok(typeof metricsRes.body.uptime === 'number');
      });

    } catch (e) {
      console.error('Test Execution Error:', e);
      stats.failed++;
    } finally {
      // Shutdown test server cleanly
      testServer.close(() => {
        console.log(`\n${COLORS.cyan}-------------------------------------------------------${COLORS.reset}`);
        console.log(`${COLORS.bright}Integration Summary:${COLORS.reset}`);
        console.log(`  Passed: ${COLORS.green}${stats.passed}${COLORS.reset}`);
        console.log(`  Failed: ${stats.failed > 0 ? COLORS.red : COLORS.green}${stats.failed}${COLORS.reset}`);
        console.log(`${COLORS.cyan}-------------------------------------------------------${COLORS.reset}\n`);
        
        process.exit(stats.failed > 0 ? 1 : 0);
      });
    }
  }

  runSuite();
});
