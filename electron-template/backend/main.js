const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const { requireElectronUtils } = require('./electron-utils.js');

const {
    registerWindowControlIpc,
    registerSimpleConfigIpc,
    applyTransparentWindowSwitches,
} = requireElectronUtils('backend');
// per-sub-app backend logic lives in backend/sub-app/<sub-app id>/
const { registerClipboardCacheIpc } = require('./sub-app/clipboard-cache/main.js');
const { registerPathManagerIpc } = require('./sub-app/path-manager/main.js');
const { registerTransparentWindowIpc } = require('./sub-app/transparent-window/main.js');

// gpu switches needed by transparent windows (transparent-window sub app);
// must be appended before the app 'ready' event
applyTransparentWindowSwitches();

// Define environment variables
const isDev = !app.isPackaged;
const isMacOS = process.platform === 'darwin';

// anchor for the ${dirExe} token used by simple-config and sub-app data files.
// packaged: the folder holding the executable. the executable is deployed into
// a subfolder (e.g. <dest>/single/, <dest>/multi/), so ${dirExe}/../data is a
// data folder shared by all build modes.
// dev: a pseudo folder <project root>/dev-run, so ${dirExe}/../data resolves
// to <project root>/data (the folder does not need to exist, it only anchors paths).
const dirExe = app.isPackaged
    ? path.dirname(process.execPath)
    : path.join(__dirname, '..', 'dev-run');

// html of the frontend build. the main window loads it directly; the
// transparent-window sub app loads it too, with hash '#transparent-window-demo'
const htmlPath = isDev
    ? path.join(__dirname, '../frontend/build/index.html')
    : path.join(process.resourcesPath, 'react-build/index.html');

let mainWindow = null;

function createWindow() {
    console.log("Creating main window...");
    console.log("isDev:", isDev);
    
    mainWindow = new BrowserWindow({
        title: 'ElectronUtils',
        width: isDev ? 1200 : 800,
        height: 600,
        // frameless: the frontend renders its own title bar (frontend/src/TitleBar.jsx),
        // so compact-window demos shrink to a rectangle without any OS header
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // so preload.js can require electron-utils
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#2e2c29'
    });

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

    // Open DevTools in development mode.
    // Detached, so window-size demos (e.g. compact window) are not affected.
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
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
    // hide the default menu bar (dev tools stay reachable via F12)
    Menu.setApplicationMenu(null);
    registerWindowControlIpc();
    registerSimpleConfigIpc({ dirExe }); // layered .jsonc config files
    registerClipboardCacheIpc(); // silently caches recent clipboard content
    registerPathManagerIpc({ dirExe }); // path bookmarks of the path-manager sub app
    // demo window of the transparent-window sub app
    registerTransparentWindowIpc({ htmlPath, preloadPath: path.join(__dirname, 'preload.js') });
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

