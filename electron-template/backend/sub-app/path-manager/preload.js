// Path-manager sub app (preload side).
// Exposes window.pathManager in the renderer, mapping one function per IPC
// channel of ./main.js. It adds no logic of its own.
//
// contextBridge and ipcRenderer are passed in from the app's preload.js.

function exposePathManager(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld('pathManager', {
        dataRead: (args) => ipcRenderer.invoke('path-manager:data-read', args),
        dataWrite: (args) => ipcRenderer.invoke('path-manager:data-write', args),
        pathOpen: (args) => ipcRenderer.invoke('path-manager:path-open', args),
    });
}

module.exports = { exposePathManager };
