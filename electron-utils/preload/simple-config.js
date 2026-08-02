// simple-config bridge (preload side).
// Exposes window.simpleConfig in the renderer, mapping one function per IPC
// channel of electron-utils/backend/simple-config.js. It adds no logic of its own.
//
// contextBridge and ipcRenderer are passed in from the app's preload.js.

function exposeSimpleConfig(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld('simpleConfig', {
        scan: (args) => ipcRenderer.invoke('simple-config:scan', args),
        stack: (args) => ipcRenderer.invoke('simple-config:stack', args),
        entrySet: (args) => ipcRenderer.invoke('simple-config:entry-set', args),
        entryDelete: (args) => ipcRenderer.invoke('simple-config:entry-delete', args),
    });
}

module.exports = { exposeSimpleConfig };
