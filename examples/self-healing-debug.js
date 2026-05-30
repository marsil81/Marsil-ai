/**
 * 🔮 MARSIL AI - Self-Healing Code Debugger Script
 * ====================================================
 * A highly professional, general-purpose open-source demonstration
 * of self-healing software compilation.
 * 
 * Usage:
 *   node examples/self-healing-debug.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {
  // dotenv is not installed in the root workspace, which is fine
}

// ANSI Colors for premium developer terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

const BUGGY_FILE_PATH = path.join(__dirname, 'buggy-code.js');

function printBanner() {
  console.log(`${COLORS.cyan}${COLORS.bright}===================================================`);
  console.log(`   🔮 MARSIL AI - SELF-HEALING COMPILE AGENT`);
  console.log(`===================================================${COLORS.reset}\n`);
}

// Helper to run shell commands
function runScript(filePath) {
  return new Promise((resolve) => {
    exec(`node "${filePath}"`, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: error ? error.code : 0
      });
    });
  });
}

// Direct lightweight call to Anthropic API to demonstrate self-healing logic
async function callLlmToHeal(buggyCode, errorMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null; // Fallback to simulated mode
  }

  const prompt = `You are a self-healing compiler agent. You are given a Javascript file that failed to compile, and its stderr error message.
Your job is to return ONLY the 100% correct, working Javascript code that fixes both the syntax errors and logical errors.
Do NOT wrap your response in markdown code blocks. Return ONLY the raw code.

--- BUGGY CODE ---
${buggyCode}

--- ERROR MESSAGE ---
${errorMessage}

Corrected working code:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  } catch (err) {
    console.log(`${COLORS.yellow}⚠️  LLM API failed to connect: ${err.message}${COLORS.reset}`);
    return null;
  }
}

async function main() {
  printBanner();

  console.log(`${COLORS.bright}[Step 1] Running target script:${COLORS.reset} ${COLORS.blue}buggy-code.js${COLORS.reset}`);
  console.log(`${COLORS.dim}Checking for syntax or runtime failures...${COLORS.reset}\n`);

  const initialRun = await runScript(BUGGY_FILE_PATH);

  if (initialRun.success) {
    console.log(`${COLORS.green}✅ Target script completed successfully without errors!${COLORS.reset}`);
    console.log(`Output: ${initialRun.stdout}`);
    return;
  }

  // File failed! Show the error output
  console.log(`${COLORS.bgRed}${COLORS.bright}  CRASH DETECTED  ${COLORS.reset}\n`);
  console.log(`${COLORS.red}${initialRun.stderr}${COLORS.reset}\n`);

  console.log(`${COLORS.bright}[Step 2] Reading source contents...${COLORS.reset}`);
  const originalCode = fs.readFileSync(BUGGY_FILE_PATH, 'utf-8');
  console.log(`${COLORS.dim}Found ${originalCode.split('\n').length} lines of code.${COLORS.reset}\n`);

  console.log(`${COLORS.bright}[Step 3] Initiating MARSIL Self-Healing Core...${COLORS.reset}`);
  console.log(`${COLORS.cyan}🔮 Analyzing compiler output & requesting automated fixes...${COLORS.reset}`);

  // Fetch or simulate LLM healed response
  let healedCode = await callLlmToHeal(originalCode, initialRun.stderr);
  let isSimulated = false;

  if (!healedCode) {
    isSimulated = true;
    console.log(`\n${COLORS.yellow}💡 (No active Anthropic API key found in .env. Running in interactive SIMULATED mode.)${COLORS.reset}`);
    // Simulate corrected code for demonstration
    healedCode = `// This file has been successfully self-healed by MARSIL AI!
console.log("Initializing dynamic calculations...");

function calculateTotal(price) {
  const tax = price * 0.15;
  // Healed Bug 1: Corrected unclosed parenthesis
  console.log("Calculating total price with tax...");
  
  // Healed Bug 2: Corrected undefined reference to price instead of totalVal
  return price + tax;
}

const result = calculateTotal(100);
console.log("Calculated Total:", result);
`;
  }

  // Display healing explanation
  console.log(`\n${COLORS.bright}${COLORS.green}✨ HEALED CODE GENERATED SUCCESSFULLY:${COLORS.reset}`);
  console.log(`${COLORS.dim}-------------------------------------------------------${COLORS.reset}`);
  console.log(healedCode);
  console.log(`${COLORS.dim}-------------------------------------------------------${COLORS.reset}\n`);

  console.log(`${COLORS.bright}[Step 4] Applying hotpatch to target file...${COLORS.reset}`);
  fs.writeFileSync(BUGGY_FILE_PATH, healedCode, 'utf-8');
  console.log(`${COLORS.green}✏️  Overwrote examples/buggy-code.js with correct syntax.${COLORS.reset}\n`);

  console.log(`${COLORS.bright}[Step 5] Verifying corrected script...${COLORS.reset}`);
  const verifyRun = await runScript(BUGGY_FILE_PATH);

  if (verifyRun.success) {
    console.log(`${COLORS.bgGreen}${COLORS.bright}  HEAL SUCCESSFUL  ${COLORS.reset}\n`);
    console.log(`${COLORS.bright}Execution Output:${COLORS.reset}`);
    console.log(`${COLORS.green}${verifyRun.stdout}${COLORS.reset}\n`);
    
    if (isSimulated) {
      console.log(`${COLORS.cyan}💡 Setup note: To run this live using real LLMs, add your keys to a .env file in the root:${COLORS.reset}`);
      console.log(`${COLORS.dim}ANTHROPIC_API_KEY=your_key_here${COLORS.reset}\n`);
    }
  } else {
    console.log(`${COLORS.bgRed}${COLORS.bright}  HEAL FAILED  ${COLORS.reset}`);
    console.log(`${COLORS.red}${verifyRun.stderr}${COLORS.reset}`);
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
});
