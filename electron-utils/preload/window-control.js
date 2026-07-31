// Window-control bridge (preload side).
// Exposes window.windowControl in the renderer, mapping one function per IPC channel
// of electron-utils/backend/window-control.js. It adds no logic of its own, so any
// renderer UI can use the API in whatever way it likes.
//
// contextBridge and ipcRenderer are passed in from the app's preload.js.

function exposeWindowControl(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld('windowControl', {
        setAlwaysOnTop: (isOnTop) => ipcRenderer.invoke('window-control:set-always-on-top', isOnTop),
        isAlwaysOnTop: () => ipcRenderer.invoke('window-control:is-always-on-top'),
        minimize: () => ipcRenderer.invoke('window-control:minimize'),
        toggleMaximize: () => ipcRenderer.invoke('window-control:toggle-maximize'),
        getBounds: () => ipcRenderer.invoke('window-control:get-bounds'),
        setBounds: (bounds) => ipcRenderer.invoke('window-control:set-bounds', bounds),
        setMinSize: (width, height) => ipcRenderer.invoke('window-control:set-min-size', width, height),
        setResizable: (isResizable) => ipcRenderer.invoke('window-control:set-resizable', isResizable),
        close: () => ipcRenderer.invoke('window-control:close'),
    });
}

module.exports = { exposeWindowControl };
