const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

const buildPaths = [
    path.join(__dirname, '../build/win-single'),
    path.join(__dirname, '../build/mac-single')
];

const tempDirNames = [
    'win-unpacked',
    'mac',
    'mac-arm64',
    'linux-unpacked'
];

const tempFileNames = [
    'builder-debug.yml',
    'builder-effective-config.yaml',
];

buildPaths.forEach(buildPath => {
    tempDirNames.forEach(dirName => {
        const dir = path.join(buildPath, dirName);
        if (fs.existsSync(dir)) {
            deleteFolderRecursive(dir);
        }
    });
    tempFileNames.forEach(fileName => {
        const filePath = path.join(buildPath, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
});
