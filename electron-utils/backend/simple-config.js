const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// simple-config: layered .jsonc config files (main process side).
//
// A config is a json-like object stored in a .jsonc file (json + comments +
// trailing commas). An app typically finds several config files (e.g. one next
// to the executable, one in its parent folder, ...) and stacks them into one
// effective config, similar to the user/workspace/folder layers of vscode.
// Which folders to scan and in which order to stack is the app's own choice;
// this module only provides the mechanics:
//
//   configScan({ dirList, fileName })         find + parse config files
//   configStack(configList)                   merge; later config overrides earlier
//   configEntrySet({ filePath, keyPath, value })   create/update one entry
//   configEntryDelete({ filePath, keyPath })       delete one entry
//
// A dir in dirList may contain the token ${dirExe} (folder of the executable),
// so paths like '${dirExe}/..' compose paths relative to the executable.
// keyPath is either 'a.b.c' or an array of keys.
//
// Note: entry-set/delete rewrite the file as pretty-printed json, so comments
// in a hand-written .jsonc file are lost once the file is edited via the api.
//
// API (ipcRenderer.invoke), registered by registerSimpleConfigIpc({ dirExe }):
//   simple-config:scan          ({ dirList, fileName })
//   simple-config:stack         ({ configList })
//   simple-config:entry-set     ({ filePath, keyPath, value })
//   simple-config:entry-delete  ({ filePath, keyPath })
// every response is { code, data, message }, code 0 = success.

let dirExeCurrent = ''; // set by registerSimpleConfigIpc, used to resolve ${dirExe}

function registerSimpleConfigIpc({ dirExe }) {
    dirExeCurrent = dirExe;

    ipcMain.handle('simple-config:scan', (event, { dirList, fileName }) => {
        try {
            const files = configScan({ dirList, fileName, dirExe: dirExeCurrent });
            return { code: 0, data: { files, dirExe: dirExeCurrent } };
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });

    ipcMain.handle('simple-config:stack', (event, { configList }) => {
        try {
            return { code: 0, data: configStack(configList) };
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });

    ipcMain.handle('simple-config:entry-set', (event, { filePath, keyPath, value }) => {
        try {
            return configEntrySet({ filePath, keyPath, value });
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });

    ipcMain.handle('simple-config:entry-delete', (event, { filePath, keyPath }) => {
        try {
            return configEntryDelete({ filePath, keyPath });
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });
}

// ---- scan ----

// replaces the ${dirExe} token and resolves to an absolute path
function resolveDirPattern(dirPattern, dirExe) {
    const dirReplaced = dirPattern.replaceAll('${dirExe}', dirExe);
    return path.resolve(dirReplaced);
}

// looks for <dir>/<fileName> in every dir of dirList (order preserved).
// each result: { dirPattern, dirResolved, filePath, isExist, code, config, textRaw, message }
function configScan({ dirList, fileName, dirExe }) {
    return dirList.map((dirPattern) => {
        const dirResolved = resolveDirPattern(dirPattern, dirExe);
        const filePath = path.join(dirResolved, fileName);
        if (!fs.existsSync(filePath)) {
            return { dirPattern, dirResolved, filePath, isExist: false, code: 0 };
        }
        const textRaw = fs.readFileSync(filePath, 'utf8');
        try {
            const config = parseJsonc(textRaw);
            return { dirPattern, dirResolved, filePath, isExist: true, code: 0, config, textRaw };
        } catch (error) {
            return { dirPattern, dirResolved, filePath, isExist: true, code: -1, textRaw, message: 'parse failed: ' + String(error) };
        }
    });
}

// ---- stack ----

// merges configs one by one; a later config overrides an earlier one.
// plain objects are merged deeply, everything else (scalar, array) is replaced.
function configStack(configList) {
    let configMerged = {};
    for (const config of configList) {
        configMerged = mergeDeep(configMerged, config);
    }
    return configMerged;
}

function mergeDeep(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override;
    }
    const result = { ...base };
    for (const [key, value] of Object.entries(override)) {
        result[key] = key in result ? mergeDeep(result[key], value) : value;
    }
    return result;
}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---- entry CRUD on one file ----

function configEntrySet({ filePath, keyPath, value }) {
    const keys = keyPathToKeys(keyPath);
    let config = {};
    if (fs.existsSync(filePath)) {
        try {
            config = parseJsonc(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            return { code: -1, message: 'existing file could not be parsed: ' + String(error) };
        }
    }
    // walk to the parent object of the target key, creating objects on the way
    let node = config;
    for (const key of keys.slice(0, -1)) {
        if (!isPlainObject(node[key])) node[key] = {};
        node = node[key];
    }
    node[keys[keys.length - 1]] = value;
    configFileWrite(filePath, config);
    return { code: 0, data: { filePath } };
}

function configEntryDelete({ filePath, keyPath }) {
    const keys = keyPathToKeys(keyPath);
    if (!fs.existsSync(filePath)) {
        return { code: -1, message: 'config file not found: ' + filePath };
    }
    const config = parseJsonc(fs.readFileSync(filePath, 'utf8'));
    let node = config;
    for (const key of keys.slice(0, -1)) {
        if (!isPlainObject(node[key])) {
            return { code: -1, message: 'entry not found: ' + keys.join('.') };
        }
        node = node[key];
    }
    const keyLast = keys[keys.length - 1];
    if (!(keyLast in node)) {
        return { code: -1, message: 'entry not found: ' + keys.join('.') };
    }
    delete node[keyLast];
    configFileWrite(filePath, config);
    return { code: 0, data: { filePath } };
}

function keyPathToKeys(keyPath) {
    if (Array.isArray(keyPath)) return keyPath;
    return String(keyPath).split('.');
}

function configFileWrite(filePath, config) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 4) + '\n', 'utf8');
}

// ---- jsonc parsing ----

// json + // and /* */ comments + trailing commas
function parseJsonc(text) {
    return JSON.parse(removeTrailingComma(removeComments(text)));
}

function removeComments(text) {
    let result = '';
    let i = 0;
    let isInString = false;
    while (i < text.length) {
        const char = text[i];
        const charNext = text[i + 1];
        if (isInString) {
            result += char;
            if (char === '\\') {
                result += charNext ?? '';
                i += 2;
                continue;
            }
            if (char === '"') isInString = false;
            i += 1;
            continue;
        }
        if (char === '"') {
            isInString = true;
            result += char;
            i += 1;
            continue;
        }
        if (char === '/' && charNext === '/') {
            while (i < text.length && text[i] !== '\n') i += 1;
            continue;
        }
        if (char === '/' && charNext === '*') {
            i += 2;
            while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1;
            i += 2;
            continue;
        }
        result += char;
        i += 1;
    }
    return result;
}

function removeTrailingComma(text) {
    let result = '';
    let isInString = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (isInString) {
            result += char;
            if (char === '\\') {
                result += text[i + 1] ?? '';
                i += 1;
            } else if (char === '"') {
                isInString = false;
            }
            continue;
        }
        if (char === '"') {
            isInString = true;
            result += char;
            continue;
        }
        if (char === ',') {
            // drop the comma if the next non-whitespace char closes an object/array
            let j = i + 1;
            while (j < text.length && /\s/.test(text[j])) j += 1;
            if (text[j] === '}' || text[j] === ']') continue;
        }
        result += char;
    }
    return result;
}

module.exports = {
    registerSimpleConfigIpc,
    resolveDirPattern,
    configScan,
    configStack,
    configEntrySet,
    configEntryDelete,
    parseJsonc,
};
