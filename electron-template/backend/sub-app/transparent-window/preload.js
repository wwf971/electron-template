// Transparent-window sub app (preload side).
// Exposes window.transparentWindow in the renderer, mapping one function per
// IPC channel of ./main.js, plus one event subscription. It adds no logic of
// its own.
//
// contextBridge and ipcRenderer are passed in from the app's preload.js.

function exposeTransparentWindow(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld('transparentWindow', {
        open: () => ipcRenderer.invoke('transparent-window:open'),
        close: () => ipcRenderer.invoke('transparent-window:close'),
        isOpen: () => ipcRenderer.invoke('transparent-window:is-open'),
        // callback() fires when the demo window is closed; returns an unsubscribe function
        onClosed: (callback) => {
            const listener = () => callback();
            ipcRenderer.on('transparent-window:closed', listener);
            return () => ipcRenderer.removeListener('transparent-window:closed', listener);
        },
    });
}

module.exports = { exposeTransparentWindow };
