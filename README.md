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

To start both the frontend and backend servers concurrently, simply run:

```bash
npm start
```

- The Frontend will run on `http://localhost:5173`
- The Backend API will run on `http://localhost:3001`

Open your browser and navigate to the frontend URL to start using Marsil Assistant!
