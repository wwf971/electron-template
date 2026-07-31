const { ipcMain, BrowserWindow } = require('electron');

// Window-control IPC API (main process side).
//
// Every handler operates on the window that sent the request, so:
// - no BrowserWindow reference needs to be passed in, and multi-window apps work as-is.
// - the API makes no assumption about which renderer UI calls it. Any component,
//   keyboard shortcut, or menu can trigger these channels through the preload bridge.

function getSenderWindow(event) {
    return BrowserWindow.fromWebContents(event.sender);
}

function registerWindowControlIpc() {
    ipcMain.handle('window-control:set-always-on-top', (event, isOnTop) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        win.setAlwaysOnTop(!!isOnTop);
        return win.isAlwaysOnTop();
    });

    ipcMain.handle('window-control:is-always-on-top', (event) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        return win.isAlwaysOnTop();
    });

    ipcMain.handle('window-control:minimize', (event) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        win.minimize();
        return true;
    });

    // returns whether the window is maximized after toggling
    ipcMain.handle('window-control:toggle-maximize', (event) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
        return win.isMaximized();
    });

    // bounds = { x, y, width, height }
    ipcMain.handle('window-control:get-bounds', (event) => {
        const win = getSenderWindow(event);
        if (!win) return null;
        return win.getBounds();
    });

    ipcMain.handle('window-control:set-bounds', (event, bounds) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        win.setBounds(bounds);
        return true;
    });

    ipcMain.handle('window-control:set-min-size', (event, width, height) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        win.setMinimumSize(width, height);
        return true;
    });

    ipcMain.handle('window-control:set-resizable', (event, isResizable) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        win.setResizable(!!isResizable);
        return true;
    });

    ipcMain.handle('window-control:close', (event) => {
        const win = getSenderWindow(event);
        if (!win) return false;
        win.close();
        return true;
    });
}

module.exports = { registerWindowControlIpc };
