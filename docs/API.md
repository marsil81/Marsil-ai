# 🌐 MARSIL AI - Core API & Architecture Guide

Welcome to the technical API and architectural blueprint for **MARSIL AI**. This document details the secure REST API routes, real-time WebSocket communication protocols, and backend modular design patterns.

---

## 🏛️ System Architecture Overview

```mermaid
graph TD
  A["[Vite Frontend]"] <-->|REST API + WebSockets| B["[Express Backend (Port 3001)]"]
  B <-->|Git Commands| C["[Local File System / Workspace]"]
  B <-->|JSON Streaming CLI| D["[Claude Code Integration]"]
  B <-->|Anthropic API Proxy (Port 3002)| E["[External LLM Providers]"]
```

The system is split into two major microservices:
1. **Frontend (Port 5173):** Vite React Single Page Application utilizing a sleek, glassmorphic HUD workspace layout.
2. **Backend (Port 3001):** Node.js Express server acting as the local workspace controller, providing terminal execution safety gates, file traversal protection, git adapter hooks, and a real-time WebSocket connection engine.

---

## 🛡️ Path Traversal Security
All file operations (`read`, `write`, `delete`, `rename`) are secured by the modular `PathSafety` utility. This utility ensures that any requested relative path resolves strictly within the workspace directory:
```javascript
const { safePath } = require('../utils/PathSafety');
const absolutePath = safePath(req.body.path); // Traversal outside workspace throws a Denied error
```

---

## 📁 REST API Endpoints

### 1. Configuration & Engine State
* **`GET /api/config`**
  * **Description:** Retrieves current LLM provider, target model, API gateway endpoint, and connection masks. Masking shields protect credentials from raw exposures.
  * **Response:**
    ```json
    {
      "provider": "anthropic",
      "model": "claude-opus-4-5",
      "baseUrl": null,
      "budget": 0,
      "hasKey": true,
      "maskedKey": "••••••••7890",
      "keyPrefix": "sk-•••",
      "claudeAvailable": true,
      "claudeVersion": "0.1.25"
    }
    ```
* **`POST /api/config`**
  * **Description:** Safely saves provider config, api keys, and session cost budgets to the local `config.json`.
* **`GET /api/status`**
  * **Description:** Returns general availability diagnostics of the underlying Claude Code CLI.

### 2. Workspace File Operations
* **`GET /api/files`**
  * **Description:** Returns a recursively mapped directory file tree of the local workspace (cached with a 3s TTL to prevent disk I/O bottlenecks).
* **`GET /api/file?path=relative/path`**
  * **Description:** Safely reads file text contents.
* **`POST /api/file`**
  * **Description:** Overwrites or creates workspace files.
* **`DELETE /api/file?path=relative/path`**
  * **Description:** Permanently deletes a workspace file.
* **`POST /api/file/rename`**
  * **Description:** Safely renames or moves workspace files.

### 3. Git Interface API
* **`GET /api/git/status`**
  * **Description:** Retrieves the local porcelain status of modified and untracked files.
* **`GET /api/git/diff`**
  * **Description:** Fetches active unified diff modifications in the local branch.
* **`GET /api/git/log?count=N`**
  * **Description:** Returns the last `N` Git commits.
* **`GET /api/git/branches`**
  * **Description:** Retrieves existing branches.
  * **Response:** `["main", "feat/self-healing", "dev"]`
* **`POST /api/git/branch`**
  * **Description:** Switches, deletes, or creates Git branches.

---

## ⚡ Real-Time WebSocket Protocols

The WebSocket connection serves as the fast bi-directional pipeline for agent communication and machine diagnostics.

### Client-to-Server Messages
1. **`chat`**
   * **Payload:** `{ "type": "chat", "text": "user prompt text", "lang": "en" }`
   * **Description:** Triggers the workspace agent to process instructions, execute verified operations, and stream results.
2. **`abort`**
   * **Payload:** `{ "type": "abort" }`
   * **Description:** Immediately cancels the active compiler/agent task, forcing processes to stop.
3. **`pong`**
   * **Payload:** `{ "type": "pong" }`
   * **Description:** Heartbeat response verifying active network state.

### Server-to-Client Messages
1. **`chat_delta`**
   * **Payload:** `{ "type": "chat_delta", "text": "incremental streamed response" }`
2. **`log`**
   * **Payload:** `{ "type": "log", "message": "ansi-colored compiler outputs" }`
3. **`metrics`**
   * **Payload:** `{ "type": "metrics", "cpu": "3.5", "ram": "42.1" }`
   * **Description:** Pushed every 5s containing host metrics.
4. **`token_usage`**
   * **Payload:** `{ "type": "token_usage", "tokensIn": 1024, "tokensOut": 512, "totalTokens": 1536 }`
