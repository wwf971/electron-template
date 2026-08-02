const { ipcMain } = require('electron');
const { requireElectronUtils } = require('../../electron-utils.js');

const { createTransparentWindow } = requireElectronUtils('backend');

// Transparent-window sub app (main process side).
// Opens one transparent frameless demo window, loading the same frontend build
// with hash '#transparent-window-demo' (frontend/src/main.jsx branches on it).
// The transparent-window feature itself (required creation-time options + gpu
// switches, and the experience behind them) lives in
// electron-utils/backend/transparent-window.js; the gpu switches are applied
// at the top of backend/main.js, before the app is ready.
//
// API (ipcRenderer.invoke), registered by registerTransparentWindowIpc:
//   transparent-window:open     ()  open the demo window (focus it if open)
//   transparent-window:close    ()  close the demo window
//   transparent-window:is-open  ()
// plus event 'transparent-window:closed', sent to the window that opened it.
// every response is { code, data, message }, code 0 = success.

let demoWindow = null;

function registerTransparentWindowIpc({ htmlPath, preloadPath }) {
    ipcMain.handle('transparent-window:open', (event) => {
        try {
            if (demoWindow !== null) {
                demoWindow.focus();
                return { code: 0, data: { isOpen: true } };
            }
            demoWindow = createTransparentWindow({
                title: 'Transparent Window Demo',
                width: 420,
                height: 240,
                alwaysOnTop: true,
                resizable: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: false, // so preload.js can require electron-utils
                    preload: preloadPath,
                },
            });
            demoWindow.loadFile(htmlPath, { hash: 'transparent-window-demo' });
            const senderContents = event.sender;
            demoWindow.on('closed', () => {
                demoWindow = null;
                if (!senderContents.isDestroyed()) {
                    senderContents.send('transparent-window:closed');
                }
            });
            return { code: 0, data: { isOpen: true } };
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });

    ipcMain.handle('transparent-window:close', () => {
        if (demoWindow !== null) {
            demoWindow.close(); // 'closed' handler resets demoWindow
        }
        return { code: 0, data: { isOpen: false } };
    });

    ipcMain.handle('transparent-window:is-open', () => {
        return { code: 0, data: { isOpen: demoWindow !== null } };
    });
}

module.exports = { registerTransparentWindowIpc };
