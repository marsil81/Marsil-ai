# Marsil AI Desktop Coding Assistant

Marsil Assistant is a powerful desktop coding assistant powered by **DeepSeek** and **Claude Code**. It provides an integrated and seamless coding experience, offering file management, direct code editing, and intelligent problem-solving features directly from your browser.

## Features

- **Agent Integration**: Seamlessly interact with DeepSeek or Claude Code.
- **Project File Tree**: Navigate your project files easily with the built-in file tree.
- **Code Editor**: View and modify code directly in the app.
- **Terminal Simulator**: Keep track of commands and their outputs.

## Prerequisites

- Node.js (v16+)
- DeepSeek API key or Claude Code installed on your system.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/marsil-assistant.git
   cd marsil-assistant
   ```

2. Install dependencies for the root, frontend, and backend all at once:
   ```bash
   npm run install-all
   ```

3. Setup Configuration:
   - Create a `config.json` file in the root of the project (or in the `backend` folder) based on `backend/config.example.json` to store your API keys. This file is ignored by Git to keep your keys secure.

## Running the Application

## Running the Application

### Method A: The Standard Developer Way (Recommended & 100% Safe)
To completely bypass Windows SmartScreen/Defender notifications and run the application natively:
1. Initialize the servers and install all dependencies:
   ```bash
   npm run install-all
   ```
2. Start both the frontend and backend concurrently:
   ```bash
   npm start
   ```

### Method B: Using Quick-Start Scripts (Windows Only)
- Double-click `start.bat` to automatically install dependencies and run both servers.
- Double-click `stop.bat` to surgically close the running servers.

---

## 🛡️ SmartScreen & Antivirus False Positives

Since Marsil AI is a local developer tool that handles background terminal tasks (like managing ports, launching subprocesses, and git checkpoints), some antivirus systems or **Windows SmartScreen** may trigger a false positive warning (e.g., "Unknown Publisher" or "Unsafe Script") when running the `.bat` files directly after downloading the ZIP.

### How to resolve:
1. **Unblock the downloaded ZIP:** 
   Right-click the downloaded `.zip` file -> Select **Properties** -> Check the **Unblock** box at the bottom -> Click **Apply** -> Extract the files.
2. **Use Method A (Standard Terminal Commands):**
   Simply run `npm run install-all` and `npm start` in your command line. Standard npm terminal commands do **not** trigger any security warnings and are 100% safe on all operating systems!

