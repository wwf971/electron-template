const { registerWindowControlIpc } = require('./window-control.js');
const {
    clipboardReadText,
    clipboardReadImageDataUrl,
    clipboardWriteText,
    clipboardWriteImageDataUrl,
} = require('./clipboard.js');
const {
    registerSimpleConfigIpc,
    resolveDirPattern,
    configScan,
    configStack,
    configEntrySet,
    configEntryDelete,
    parseJsonc,
} = require('./simple-config.js');
const {
    dataFileNameLayer0,
    dataFileResolve,
    dataFileBackup,
    formatTimeStampForFileName,
} = require('./simple-data.js');
const {
    applyTransparentWindowSwitches,
    createTransparentWindow,
} = require('./transparent-window.js');

module.exports = {
    registerWindowControlIpc,
    // stateless clipboard access; stateful features (e.g. a cache) belong to the app
    clipboardReadText,
    clipboardReadImageDataUrl,
    clipboardWriteText,
    clipboardWriteImageDataUrl,
    // layered .jsonc config files
    registerSimpleConfigIpc,
    resolveDirPattern,
    configScan,
    configStack,
    configEntrySet,
    configEntryDelete,
    parseJsonc,
    // two-layer sub-app data files (<name>.0.<ext> preferred over <name>.<ext>)
    dataFileNameLayer0,
    dataFileResolve,
    dataFileBackup,
    formatTimeStampForFileName,
    // transparent frameless windows (gpu switches + creation-time options)
    applyTransparentWindowSwitches,
    createTransparentWindow,
};
