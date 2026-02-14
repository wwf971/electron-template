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

const buildPath = path.join(__dirname, '../build-single');
const tempDirs = [
    path.join(buildPath, 'win-unpacked'),
    path.join(buildPath, 'mac'),
    path.join(buildPath, 'mac-arm64'),
    path.join(buildPath, 'linux-unpacked')
];

tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        deleteFolderRecursive(dir);
    }
});
