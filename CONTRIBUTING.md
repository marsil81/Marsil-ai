# 🤝 Contributing to MARSIL AI

Thank you for your interest in contributing to **MARSIL AI**! We want to make contributing to this project as easy and safe as possible.

---

## 🛡️ Coding & Security Standards

Before submitting a Pull Request, please ensure your changes adhere to our core standards:

1. **Security First:**
   * Never expose credentials or raw API keys in client code or frontend payloads.
   * All file operations MUST resolve relative paths strictly through the modular `safePath` utility:
     ```javascript
     const { safePath } = require('../utils/PathSafety');
     const absolutePath = safePath(relativePath);
     ```
   * Do not introduce direct shell executions (`child_process.exec`) without robust parameter validation. Prefer `execFile` where possible.

2. **Clean Architecture:**
   * Keep backend modules isolated:
     * `src/presentation/` for HTTP, WebSocket, and REST endpoints.
     * `src/application/` for business logic and agent orchestrations.
     * `src/infrastructure/` for third-party client wrappers and git adapters.
     * `src/utils/` for stateless utilities.
   * Write modular Javascript/Typescript.

3. **Verification:**
   * Run the local automated security test suite before committing:
     ```bash
     npm test
     ```
   * All tests must pass, and code must compile flawlessly.
   * Verify linting rules:
     ```bash
     npm run lint
     ```

---

## 🛠️ Step-by-Step Contribution Process

1. **Fork the Repository:** Create a personal copy of the project on GitHub.
2. **Clone Locally:**
   ```bash
   git clone https://github.com/your-username/Marsil-ai.git
   cd Marsil-ai
   ```
3. **Install Dependencies:**
   ```bash
   npm run install-all
   ```
4. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/your-incredible-feature
   ```
5. **Implement and Test:** Make changes, ensure the test runner passes (`npm test`), and add any relevant test assertions.
6. **Commit with Conventional Messages:**
   ```bash
   git commit -m "feat: add highly optimized local proxy caching"
   ```
7. **Submit a Pull Request:** Push to your fork and submit a PR to the `main` branch of `marsil81/Marsil-ai`.

We appreciate your effort in making MARSIL AI the absolute best open-source AI developer environment!
