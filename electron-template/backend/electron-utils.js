const fs = require('fs');
const path = require('path');

// Locates the electron-utils folder (shared electron features, lives in the
// electron-template repo). Used by both main.js and preload.js.
// Checked in order:
const candidatePaths = [
    // 1. packaged app: copied to resources/ by electron-builder (see build-script/electron-builder-*.json)
    path.join(process.resourcesPath || '', 'electron-utils'),
    // 2. this project is the electron-template repo itself
    path.join(__dirname, '../../electron-utils'),
    // 3. dev workspace: electron-template repo sits at /project/2025/electron-template
    path.join(__dirname, '../../../2025/electron-template/electron-utils'),
    // 4. standalone clone: electron-template repo as git submodule under third_party/
    path.join(__dirname, '../third_party/electron-template/electron-utils'),
];

const electronUtilsPath = candidatePaths.find(
    (candidatePath) => fs.existsSync(path.join(candidatePath, 'package.json'))
);

if (!electronUtilsPath) {
    throw new Error('electron-utils not found. Checked:\n' + candidatePaths.join('\n'));
}

// layerName: 'backend' or 'preload'
function requireElectronUtils(layerName) {
    return require(path.join(electronUtilsPath, layerName));
}

module.exports = { electronUtilsPath, requireElectronUtils };
