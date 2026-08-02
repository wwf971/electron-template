const { app, BrowserWindow } = require('electron');

// Transparent-window feature (main process side), extracted from the
// electron-transparent-text project. Experience gathered there — things that
// silently break the transparency if forgotten:
//
// - transparency is decided when the window is created (transparent: true);
//   it can NOT be toggled on an existing window.
// - the window must be frameless (frame: false); the OS window frame itself
//   can not be transparent.
// - windows: on some machines the "transparent" area renders as a solid black
//   rectangle when the gpu process runs separately. the switches appended by
//   applyTransparentWindowSwitches() ('--in-process-gpu',
//   '--ignore-gpu-blacklist') work around this, and they MUST be appended
//   before the app 'ready' event (call it at the top of main.js).
// - macos: hasShadow must be false. otherwise the OS draws a shadow around the
//   (invisible) window rectangle, and shadow artifacts stay on screen when the
//   window content changes.
// - a transparent frameless window has no native title bar, and on windows it
//   also loses the native resize borders. both are re-implemented in the
//   renderer:
//     move:   css '-webkit-app-region: drag' on a header area
//             ('no-drag' on every interactive element inside it)
//     resize: thin hit areas along the window edges/corners, calling
//             startWindowResize() of electron-utils/frontend/window-resize.js
// - the renderer page must keep html / body / root element backgrounds
//   transparent, otherwise the page background fills the whole window and
//   nothing looks transparent.

// gpu switches needed on windows; must run before the app 'ready' event
function applyTransparentWindowSwitches() {
    app.commandLine.appendSwitch('--in-process-gpu');
    app.commandLine.appendSwitch('--ignore-gpu-blacklist');
}

// creates a BrowserWindow with the options required for transparency
// (transparent, frameless, no shadow); everything else comes from options.
function createTransparentWindow(options = {}) {
    return new BrowserWindow({
        ...options,
        transparent: true,
        frame: false,
        hasShadow: false,
    });
}

module.exports = {
    applyTransparentWindowSwitches,
    createTransparentWindow,
};
