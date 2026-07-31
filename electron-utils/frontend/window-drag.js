// Window drag-to-move feature (frontend side), extracted from electron-transparent-text.
// Lets any element move the whole window when dragged (useful for frameless or
// compact windows that have no title bar to grab).
//
// Call from the element's onMouseDown. If the mouse is released without real
// movement, onClickWithoutDrag is called instead, so one element can act as
// both a drag handle and a button.

const DRAG_THRESHOLD_PX = 3;

async function startWindowDrag(eventMouseDown, { onClickWithoutDrag } = {}) {
    // capture mouse position synchronously, before any await
    const mouseStart = { x: eventMouseDown.screenX, y: eventMouseDown.screenY };
    eventMouseDown.preventDefault();
    eventMouseDown.stopPropagation();

    const boundsStart = await window.windowControl.getBounds();
    let isMoved = false;

    const onMouseMove = (event) => {
        const dx = event.screenX - mouseStart.x;
        const dy = event.screenY - mouseStart.y;
        if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
            isMoved = true;
        }
        window.windowControl.setBounds({
            x: boundsStart.x + dx,
            y: boundsStart.y + dy,
            width: boundsStart.width,
            height: boundsStart.height,
        });
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!isMoved && onClickWithoutDrag) {
            onClickWithoutDrag();
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

export { startWindowDrag };
