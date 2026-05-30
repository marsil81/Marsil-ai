/**
 * 🌌 MARSIL AI - Desktop Electron Preload Sandbox
 * ===================================================
 * Safely exposes necessary system metrics and configurations
 * to the renderer process without opening security vulnerability holes.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('marsilDesktop', {
    platform: process.platform,
    version: '1.0.0-beta.1',
    isDesktop: true
});
