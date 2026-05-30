/**
 * 🌌 MARSIL AI - Desktop Electron Application Shell
 * ===================================================
 * Bootstraps the backend server inside a dedicated child subprocess
 * and opens a high-legibility widescreen container frame.
 */

const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');

let backendProcess = null;
let mainWindow = null;

function startBackend() {
    // Spin up the backend Server.js in a separate background thread
    const serverPath = path.join(__dirname, 'backend/src/presentation/Server.js');
    backendProcess = fork(serverPath, [], {
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: 'inherit'
    });

    backendProcess.on('exit', (code) => {
        console.log(`Backend process terminated with code: ${code}`);
    });
}

function createWindow() {
    // Build premium desktop shell window matching количественные Quant standards
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: "🌌 MARSIL AI — Coding & Quant Assistant",
        backgroundColor: '#0f172a', // Premium deep slate fallback
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Preload sandbox file
        }
    });

    // Widescreen comfort layout loading Express backend port 3001 serving production bundle
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:3001');
    }, 2000); // 2-second grace period for Server.js initialization

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Surgical exit routine terminating subprocesses cleanly
app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
        backendProcess = null;
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
