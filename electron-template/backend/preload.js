const { contextBridge, ipcRenderer } = require('electron');
const { requireElectronUtils } = require('./electron-utils.js');

const { exposeWindowControl, exposeSimpleConfig } = requireElectronUtils('preload');
// per-sub-app preload bridges live in backend/sub-app/<sub-app id>/
const { exposeClipboardCache } = require('./sub-app/clipboard-cache/preload.js');
const { exposePathManager } = require('./sub-app/path-manager/preload.js');
const { exposeTransparentWindow } = require('./sub-app/transparent-window/preload.js');

// window.windowControl: minimize, toggle-maximize, always-on-top, bounds, etc.
exposeWindowControl(contextBridge, ipcRenderer);

// window.simpleConfig: scan/stack layered .jsonc config files, entry CRUD
exposeSimpleConfig(contextBridge, ipcRenderer);

// window.clipboardCache: cached clipboard entries + new-entry event
exposeClipboardCache(contextBridge, ipcRenderer);

// window.pathManager: path bookmarks read/write, open a path
exposePathManager(contextBridge, ipcRenderer);

// window.transparentWindow: open/close the transparent demo window
exposeTransparentWindow(contextBridge, ipcRenderer);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // You can add IPC handlers here
    // Example:
    // getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    }
});

