// Clipboard-cache sub app (preload side).
// Exposes window.clipboardCache in the renderer, mapping one function per IPC
// channel of ./main.js, plus one event subscription. It adds no logic of its own.
//
// contextBridge and ipcRenderer are passed in from the app's preload.js.

function exposeClipboardCache(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld('clipboardCache', {
        getEntries: () => ipcRenderer.invoke('clipboard-cache:get-entries'),
        setCacheSize: (size) => ipcRenderer.invoke('clipboard-cache:set-cache-size', size),
        applyEntry: (entryId) => ipcRenderer.invoke('clipboard-cache:apply-entry', entryId),
        // callback(entry) fires when new clipboard content is captured; returns an unsubscribe function
        onEntryNew: (callback) => {
            const listener = (event, entry) => callback(entry);
            ipcRenderer.on('clipboard-cache:entry-new', listener);
            return () => ipcRenderer.removeListener('clipboard-cache:entry-new', listener);
        },
    });
}

module.exports = { exposeClipboardCache };
