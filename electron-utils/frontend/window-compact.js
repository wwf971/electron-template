// Compact-window feature (frontend side), extracted from electron-transparent-text.
// Shrinks the window to a small fixed rectangle, and restores it later.
// While compact, the window is on top of other windows by default (isOnTop).
// Uses window.windowControl (exposed by preload/window-control.js).
//
// The caller keeps the returned stateSaved and passes it back on exit,
// so this module stays stateless and multiple UIs can drive it.
//
// Note: the compact rectangle only looks frameless if the window itself is
// frameless (BrowserWindow frame: false); a framed window keeps its OS header.

// returns stateSaved = { bounds, isOnTop }: the window state before shrinking
async function enterCompactWindow({ width, height, isOnTop = true }) {
    const boundsNormal = await window.windowControl.getBounds();
    const isOnTopNormal = await window.windowControl.isAlwaysOnTop();
    await window.windowControl.setResizable(false);
    await window.windowControl.setMinSize(width, height);
    await window.windowControl.setBounds({
        x: boundsNormal.x,
        y: boundsNormal.y,
        width,
        height,
    });
    await window.windowControl.setAlwaysOnTop(isOnTop);
    return { bounds: boundsNormal, isOnTop: isOnTopNormal };
}

// restores width/height and always-on-top saved by enterCompactWindow(), at the
// current position (the compact rectangle may have been dragged elsewhere)
async function exitCompactWindow({ stateSaved, minWidth, minHeight }) {
    const boundsCurrent = await window.windowControl.getBounds();
    await window.windowControl.setResizable(true);
    await window.windowControl.setMinSize(minWidth, minHeight);
    await window.windowControl.setBounds({
        x: boundsCurrent.x,
        y: boundsCurrent.y,
        width: stateSaved.bounds.width,
        height: stateSaved.bounds.height,
    });
    await window.windowControl.setAlwaysOnTop(stateSaved.isOnTop);
}

export { enterCompactWindow, exitCompactWindow };
