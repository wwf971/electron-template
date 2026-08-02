const { ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { requireElectronUtils } = require('../../electron-utils.js');

const { resolveDirPattern, dataFileResolve, dataFileBackup } = requireElectronUtils('backend');

// Path-manager sub app (main process side).
// Reads/writes the path bookmarks of the user, stored as a two-layer yaml data
// file in the data folder of the app (by convention ${dirExe}/../data, see the
// doc of the template repo). The folder is overridable via the layered config
// of the sub app (simple-config feature); the resolved folder is passed in per
// call, so this module itself holds no state.
//
// Two-layer data file (simple-data feature of electron-utils):
//   data-path-manager.0.yaml   authentic private data, gitignored
//   data-path-manager.yaml     example data, safe to commit
// The layers are not merged: one file is picked and used for all CRUD.
// If neither file exists, data-path-manager.0.yaml is created with template
// content. Every load also copies the used file to <full name>.<time stamp>.bak.
//
// API (ipcRenderer.invoke), registered by registerPathManagerIpc({ dirExe }):
//   path-manager:data-read   ({ dirData })            read the whole bookmarks file
//   path-manager:data-write  ({ dirData, dataPaths }) overwrite the whole bookmarks file
//   path-manager:path-open   ({ pathTarget })         open a path with the OS default app
// every response is { code, data, message }, code 0 = success.

const fileNameData = 'data-path-manager.yaml';

// content of a freshly created data-path-manager.0.yaml
const dataPathsTemplate = {
    documents: ['C:\\Users\\me\\Documents'],
    downloads: {
        browser: 'C:\\Users\\me\\Downloads',
        video: 'D:\\Videos\\Download',
    },
};

// picks the data file to use (see the two-layer rule above)
function dataResolve(dirDataResolved) {
    return dataFileResolve({
        dirData: dirDataResolved,
        fileName: fileNameData,
        parseText: (text) => yaml.load(text) ?? {},
    });
}

function registerPathManagerIpc({ dirExe }) {
    ipcMain.handle('path-manager:data-read', (event, { dirData }) => {
        try {
            const dirDataResolved = resolveDirPattern(dirData, dirExe);
            let { files, fileUsed } = dataResolve(dirDataResolved);
            let isCreated = false;
            if (fileUsed === null && files.every((file) => !file.isExist)) {
                // neither layer exists: create the 0-layer file with template content
                const filePathLayer0 = files[0].filePath;
                fs.mkdirSync(dirDataResolved, { recursive: true });
                fs.writeFileSync(filePathLayer0, yaml.dump(dataPathsTemplate), 'utf8');
                isCreated = true;
                ({ files, fileUsed } = dataResolve(dirDataResolved));
            }
            if (fileUsed === null) {
                // a data file exists but no layer is usable (e.g. the 0-layer
                // file is broken and the base file is missing); never overwrite
                const fileBroken = files.find((file) => file.isExist);
                return { code: -1, message: fileBroken.filePath + ': ' + fileBroken.message };
            }
            if (fileUsed.code !== 0) {
                // the picked file exists but can not be parsed
                return { code: -1, message: fileUsed.filePath + ': ' + fileUsed.message };
            }
            const filePathBackup = dataFileBackup({ filePath: fileUsed.filePath });
            return {
                code: 0,
                data: {
                    dirDataResolved,
                    files,
                    filePathUsed: fileUsed.filePath,
                    layerUsed: fileUsed.layer,
                    isCreated,
                    filePathBackup,
                    dataPaths: fileUsed.data,
                },
            };
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });

    ipcMain.handle('path-manager:data-write', (event, { dirData, dataPaths }) => {
        try {
            const dirDataResolved = resolveDirPattern(dirData, dirExe);
            // write to the same file that a load would pick; if neither layer
            // exists yet, write the 0-layer file
            const { files, fileUsed } = dataResolve(dirDataResolved);
            if (fileUsed === null && files.some((file) => file.isExist)) {
                const fileBroken = files.find((file) => file.isExist);
                return { code: -1, message: 'refuse to overwrite unparsable file: ' + fileBroken.filePath };
            }
            const filePath = fileUsed !== null ? fileUsed.filePath : files[0].filePath;
            fs.mkdirSync(dirDataResolved, { recursive: true });
            fs.writeFileSync(filePath, yaml.dump(dataPaths), 'utf8');
            return { code: 0, data: { filePath } };
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });

    ipcMain.handle('path-manager:path-open', async (event, { pathTarget }) => {
        try {
            if (!fs.existsSync(pathTarget)) {
                return { code: -1, message: 'path does not exist: ' + pathTarget };
            }
            const messageError = await shell.openPath(pathTarget);
            if (messageError !== '') {
                return { code: -1, message: messageError };
            }
            return { code: 0 };
        } catch (error) {
            return { code: -1, message: String(error) };
        }
    });
}

module.exports = { registerPathManagerIpc };
