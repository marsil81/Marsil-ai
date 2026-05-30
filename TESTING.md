# 🛡️ MARSIL AI — Comprehensive Verification & Test Suite

This document outlines the testing architecture, validation scripts, and security verification tools designed to protect MARSIL AI against path traversals, memory leaks, and input injections.

---

## 🚀 Execution Commands

To execute the entire, unified test runner across all suites (Jest unit tests + custom security assertions + integration tests):

```bash
# Navigate to the backend directory
cd backend

# Run the complete verification suite
npm test
```

To run individual test scripts independently:

```bash
# Run Jest Unit Tests only
npm run test:jest

# Check syntax validity of all backend modules
npm run lint:check

# Perform static TypeScript type checks
npm run typecheck
```

---

## 📊 Comprehensive Test Coverage Matrix

The automated verification suite comprises **3 specialized testing frameworks** with 100% success targets:

| Suite Name | Scope | Testing Method | Verification Focus |
| :--- | :--- | :--- | :--- |
| **1. Jest Unit Tests** | `PathSafety`, `WebSocketHandler` | Jest + `ts-jest` assertions | Validates path sanitation, bounds, and payload schema controls. |
| **2. Security Asserter** | `PathSafety`, `CryptoHelper`, Masking | Custom ANSI assertion script | Verifies AES-256-CBC encryption, secret masking, and directory traversal blocks. |
| **3. API Integration** | Express routes (`Server.js`) | Dynamic HTTP/JSON probes | Verifies endpoint health (`/api/health`), status (`/api/status`), and HUD telemetries (`/api/metrics`). |

---

## 📂 Test File Directory Structures

All test suites and mock specifications are organized under the following paths:

* **[backend/src/test/core.test.ts](./backend/src/test/core.test.ts):** Jest unit tests for core module functions.
* **[backend/src/test/security.test.js](./backend/src/test/security.test.js):** Regression asserter for credentials, paths, and AES encryption.
* **[backend/src/test/integration.test.js](./backend/src/test/integration.test.js):** REST API live connection checks.
* **[backend/jest.config.js](./backend/jest.config.js):** Jest runner execution configs.

---

## 🧪 Detailed Test Case Specifications

### 1. Path Safety & Traversal Shields (`safePath`)
- **Valid relative resolution:** Ensures files inside the workspace relative directories resolved perfectly.
- **Valid absolute resolution:** Confirms absolute path references within workspace are allowed.
- **Parent Traversal (`../../`) Denial:** Asserts that traversing outside the workspace root raises a fatal access denial error.
- **System Roots (`/windows/`) Denial:** Asserts that accessing standard operating system folders is strictly blocked.
- **Redundant dots resolution:** Ensures `./folder/./../` segments are resolved safely without bypassing security constraints.

### 2. WebSocket Protocol Guards (`validateMessage`)
- **Valid formats:** Approves valid bilingual `chat` dialogues.
- **Payload type validation:** Rejects non-object payloads or undefined values.
- **Command Injection shields:** Blocks unrecognized message types containing system command inputs.
- **Rate-limiting limits:** Rejects messages exceeding the standard text size constraints to prevent Denial-of-Service (DoS).
