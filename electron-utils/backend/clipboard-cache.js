const { ipcMain, clipboard, nativeImage, BrowserWindow } = require('electron');

// Clipboard-cache feature (main process side).
// Silently polls the system clipboard and caches the last N contents (text or
// image), so accidentally overwritten clipboard content can be recovered.
// Electron has no clipboard-change event, so polling is the standard way.
//
// entry = { id, type: 'text' | 'image', text, imageDataUrl, timeCopied }
// entries are kept newest first.
//
// API (ipcRenderer.invoke):
//   clipboard-cache:get-entries          -> { code: 0, data: { entries, cacheSize } }
//   clipboard-cache:set-cache-size  (n)  -> { code: 0, data: cacheSize } | { code: -1, message }
//   clipboard-cache:apply-entry     (id) -> { code: 0 } | { code: -1, message }
//       writes a cached entry back to the system clipboard
// Event (sent to every window):
//   clipboard-cache:entry-new  (entry)   when new clipboard content is captured

let entries = [];
let cacheSize = 5;
let idNext = 1;
// last content seen on the clipboard, to detect changes between polls
let textSeenLast = '';
let imageDataUrlSeenLast = '';

function registerClipboardCacheIpc({ cacheSizeDefault = 5, pollIntervalMs = 1000 } = {}) {
    cacheSize = cacheSizeDefault;

    capturePoll(); // capture what is on the clipboard right now
    setInterval(capturePoll, pollIntervalMs);

    ipcMain.handle('clipboard-cache:get-entries', () => {
        return { code: 0, data: { entries, cacheSize } };
    });

    ipcMain.handle('clipboard-cache:set-cache-size', (event, size) => {
        const sizeInt = parseInt(size, 10);
        if (isNaN(sizeInt) || sizeInt < 1 || sizeInt > 100) {
            return { code: -1, message: 'cache size must be an integer in 1..100' };
        }
        cacheSize = sizeInt;
        entries = entries.slice(0, cacheSize);
        return { code: 0, data: cacheSize };
    });

    ipcMain.handle('clipboard-cache:apply-entry', (event, entryId) => {
        const entry = entries.find((item) => item.id === entryId);
        if (!entry) {
            return { code: -1, message: 'entry not found: ' + entryId };
        }
        if (entry.type === 'image') {
            clipboard.writeImage(nativeImage.createFromDataURL(entry.imageDataUrl));
            // remember as last seen, so the next poll does not re-capture it
            imageDataUrlSeenLast = entry.imageDataUrl;
        } else {
            clipboard.writeText(entry.text);
            textSeenLast = entry.text;
        }
        return { code: 0 };
    });
}

function capturePoll() {
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
        const imageDataUrl = image.toDataURL();
        if (imageDataUrl !== imageDataUrlSeenLast) {
            imageDataUrlSeenLast = imageDataUrl;
            addEntry({ type: 'image', imageDataUrl });
        }
        return;
    }
    const text = clipboard.readText();
    if (text !== '' && text !== textSeenLast) {
        textSeenLast = text;
        addEntry({ type: 'text', text });
    }
}

function addEntry(entryPartial) {
    const entry = {
        id: idNext,
        timeCopied: Date.now(),
        ...entryPartial,
    };
    idNext += 1;
    entries.unshift(entry);
    entries = entries.slice(0, cacheSize);

    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send('clipboard-cache:entry-new', entry);
        }
    }
}

module.exports = { registerClipboardCacheIpc };
