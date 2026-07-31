const { contextBridge, ipcRenderer } = require('electron');
const { requireElectronUtils } = require('./electron-utils.js');

const { exposeWindowControl, exposeClipboardCache } = requireElectronUtils('preload');

// window.windowControl: minimize, toggle-maximize, always-on-top, bounds, etc.
exposeWindowControl(contextBridge, ipcRenderer);

// window.clipboardCache: cached clipboard entries + new-entry event
exposeClipboardCache(contextBridge, ipcRenderer);

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

