const fs = require('fs');
const path = require('path');

// simple-data: two-layer data files of sub apps (main process side).
//
// A sub-app data file (e.g. data-path-manager.yaml) can exist in two layers,
// similar to the two-layer config files, but with a different rule: the layers
// are NOT merged, exactly one file is picked and used for all CRUD:
//
//   data-<sub app id>.0.<ext>   authentic (often private) data, gitignored
//   data-<sub app id>.<ext>     example data, safe to commit
//
//   pick the file to use:
//     -> <name>.0.<ext> exists and parses ok? -> use it
//     -> else <name>.<ext> exists?            -> use it
//     -> else                                 -> none (caller typically creates
//                                                <name>.0.<ext> with template content)
//
// Parsing is file-format specific (yaml, json, ...), so the caller passes a
// parseText function; this module only provides the layer mechanics.
//
//   dataFileResolve({ dirData, fileName, parseText })   pick the file to use
//   dataFileBackup({ filePath })                        copy to <full name>.<time stamp>.bak
//   formatTimeStampForFileName(date)                    e.g. 20260520_23250530+09

// 'data-path-manager.yaml' -> 'data-path-manager.0.yaml'
function dataFileNameLayer0(fileName) {
    const ext = path.extname(fileName);
    return fileName.slice(0, fileName.length - ext.length) + '.0' + ext;
}

// checks both layers of <dirData>/<fileName> and picks the file to use.
// each file status: { layer: '0' | 'base', filePath, isExist, code, message?, data? }
// returns { files: [status of layer 0, status of base], fileUsed: one of files or null }
function dataFileResolve({ dirData, fileName, parseText }) {
    const fileLayer0 = dataFileCheck(path.join(dirData, dataFileNameLayer0(fileName)), '0', parseText);
    const fileBase = dataFileCheck(path.join(dirData, fileName), 'base', parseText);
    let fileUsed = null;
    if (fileLayer0.isExist && fileLayer0.code === 0) {
        fileUsed = fileLayer0;
    } else if (fileBase.isExist) {
        fileUsed = fileBase;
    }
    return { files: [fileLayer0, fileBase], fileUsed };
}

function dataFileCheck(filePath, layer, parseText) {
    if (!fs.existsSync(filePath)) {
        return { layer, filePath, isExist: false, code: 0 };
    }
    try {
        const data = parseText(fs.readFileSync(filePath, 'utf8'));
        return { layer, filePath, isExist: true, code: 0, data };
    } catch (error) {
        return { layer, filePath, isExist: true, code: -1, message: 'parse failed: ' + String(error) };
    }
}

// copies filePath to <full file name>.<time stamp>.bak (same folder).
// returns the backup file path.
function dataFileBackup({ filePath }) {
    const filePathBackup = filePath + '.' + formatTimeStampForFileName() + '.bak';
    fs.copyFileSync(filePath, filePathBackup);
    return filePathBackup;
}

// preferred time stamp format for file names: 20260520_23250530+09
// (10 ms precision; the trailing +09 is the utc offset in hours)
function formatTimeStampForFileName(date = new Date()) {
    const pad = (num, len) => String(num).padStart(len, '0');
    const offsetHours = Math.trunc(-date.getTimezoneOffset() / 60);
    const offsetText = (offsetHours >= 0 ? '+' : '-') + pad(Math.abs(offsetHours), 2);
    return (
        pad(date.getFullYear(), 4) + pad(date.getMonth() + 1, 2) + pad(date.getDate(), 2) +
        '_' +
        pad(date.getHours(), 2) + pad(date.getMinutes(), 2) + pad(date.getSeconds(), 2) +
        pad(Math.floor(date.getMilliseconds() / 10), 2) +
        offsetText
    );
}

module.exports = {
    dataFileNameLayer0,
    dataFileResolve,
    dataFileBackup,
    formatTimeStampForFileName,
};
