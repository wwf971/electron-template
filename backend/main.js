const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

// Define environment variables
const isDev = !app.isPackaged;
const isMacOS = process.platform === 'darwin';

let mainWindow = null;

function createWindow() {
    console.log("Creating Hello World window...");
    console.log("isDev:", isDev);
    
    mainWindow = new BrowserWindow({
        title: 'Hello World',
        width: isDev ? 1200 : 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#2e2c29'
    });

    // Load React app - check if we're in development or production
    let htmlPath;
    if (isDev) {
        // Development: React is in relative path
        htmlPath = path.join(__dirname, '../frontend/build/index.html');
    } else {
        // Production: React files are in extraResources
        htmlPath = path.join(process.resourcesPath, 'react-build/index.html');
    }
    
    console.log("Trying to load React from:", htmlPath);
    
    // Check if file exists
    if (fs.existsSync(htmlPath)) {
        console.log("React file exists, loading...");
        mainWindow.loadFile(htmlPath);
    } else {
        console.error("React file NOT found at:", htmlPath);
        // Load a simple error page
        mainWindow.loadURL('data:text/html,<h1>Error: React build not found</h1><p>Run: pnpm run build:frontend</p><p>Path: ' + htmlPath + '</p>');
    }

    // Open DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Add debugging events
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page finished loading');
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
    });

    // Add keyboard shortcut for dev tools (F12)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            mainWindow.webContents.toggleDevTools();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (!isMacOS) {
        app.quit();
    }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

