const { clipboard, nativeImage } = require('electron');

// Stateless clipboard access (main process side). No polling, no cache, no IPC.
// An app that wants stateful behavior (e.g. a clipboard history) builds it on
// top of these functions in its own backend; see the clipboard-cache sub app
// of the demo (electron-template/backend/sub-app/clipboard-cache/).

function clipboardReadText() {
    return clipboard.readText();
}

// returns '' when there is no image on the clipboard
function clipboardReadImageDataUrl() {
    const image = clipboard.readImage();
    if (image.isEmpty()) return '';
    return image.toDataURL();
}

function clipboardWriteText(text) {
    clipboard.writeText(text);
}

function clipboardWriteImageDataUrl(imageDataUrl) {
    clipboard.writeImage(nativeImage.createFromDataURL(imageDataUrl));
}

module.exports = {
    clipboardReadText,
    clipboardReadImageDataUrl,
    clipboardWriteText,
    clipboardWriteImageDataUrl,
};
