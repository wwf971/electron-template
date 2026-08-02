// Window resize-by-dragging-edges feature (frontend side), extracted from
// electron-transparent-text. A transparent frameless window loses the native
// resize borders on windows, so resizing is re-implemented in the renderer:
// the app renders thin hit areas along the window edges/corners, and calls
// startWindowResize from their onMouseDown.
//
// direction: 'top' | 'right' | 'bottom' | 'left'
//            | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
// Uses window.windowControl (exposed by preload/window-control.js).

async function startWindowResize(eventMouseDown, direction, { minWidth, minHeight }) {
    // capture mouse position synchronously, before any await
    const mouseStart = { x: eventMouseDown.screenX, y: eventMouseDown.screenY };
    eventMouseDown.preventDefault();
    eventMouseDown.stopPropagation();

    const boundsStart = await window.windowControl.getBounds();

    const onMouseMove = (event) => {
        const deltaX = event.screenX - mouseStart.x;
        const deltaY = event.screenY - mouseStart.y;
        const boundsNew = { ...boundsStart };

        if (direction.includes('right')) {
            boundsNew.width = Math.max(minWidth, boundsStart.width + deltaX);
        }
        if (direction.includes('left')) {
            const widthNew = Math.max(minWidth, boundsStart.width - deltaX);
            boundsNew.x = boundsStart.x + (boundsStart.width - widthNew);
            boundsNew.width = widthNew;
        }
        if (direction.includes('bottom')) {
            boundsNew.height = Math.max(minHeight, boundsStart.height + deltaY);
        }
        if (direction.includes('top')) {
            const heightNew = Math.max(minHeight, boundsStart.height - deltaY);
            boundsNew.y = boundsStart.y + (boundsStart.height - heightNew);
            boundsNew.height = heightNew;
        }

        window.windowControl.setBounds(boundsNew);
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

export { startWindowResize };
