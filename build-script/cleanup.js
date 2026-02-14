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

function moveContentsUp(unpackedPath, targetPath) {
    if (fs.existsSync(unpackedPath)) {
        const files = fs.readdirSync(unpackedPath);
        files.forEach(file => {
            const sourcePath = path.join(unpackedPath, file);
            const destPath = path.join(targetPath, file);
            fs.renameSync(sourcePath, destPath);
        });
        fs.rmdirSync(unpackedPath);
    }
}

const buildWinPath = path.join(__dirname, '../build/win');
const buildMacPath = path.join(__dirname, '../build/mac');

const winUnpackedPath = path.join(buildWinPath, 'win-unpacked');
if (fs.existsSync(winUnpackedPath)) {
    moveContentsUp(winUnpackedPath, buildWinPath);
}

const macUnpackedPath = path.join(buildMacPath, 'mac');
if (fs.existsSync(macUnpackedPath)) {
    moveContentsUp(macUnpackedPath, buildMacPath);
}

const macArm64UnpackedPath = path.join(buildMacPath, 'mac-arm64');
if (fs.existsSync(macArm64UnpackedPath)) {
    moveContentsUp(macArm64UnpackedPath, buildMacPath);
}

const tempFiles = [
    path.join(buildWinPath, 'builder-debug.yml'),
    path.join(buildWinPath, 'builder-effective-config.yaml'),
    path.join(buildMacPath, 'builder-debug.yml'),
    path.join(buildMacPath, 'builder-effective-config.yaml')
];

tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
});
