const fs = require('fs');
const path = require('path');

// Copies electron-utils into ../build/electron-utils before packaging, so that the
// electron-builder configs can point extraResources at one fixed path, no matter
// where electron-utils was actually found. Checked in order:
const candidatePaths = [
    // 1. this project is the electron-template repo itself
    path.join(__dirname, '../../electron-utils'),
    // 2. dev workspace: electron-template repo sits at /project/2025/electron-template
    path.join(__dirname, '../../../2025/electron-template/electron-utils'),
    // 3. standalone clone: electron-template repo as git submodule under third_party/
    path.join(__dirname, '../third_party/electron-template/electron-utils'),
];

const sourcePath = candidatePaths.find(
    (candidatePath) => fs.existsSync(path.join(candidatePath, 'package.json'))
);

if (!sourcePath) {
    console.error('electron-utils not found. Checked:\n' + candidatePaths.join('\n'));
    process.exit(1);
}

const stagingPath = path.join(__dirname, '../build/electron-utils');
fs.rmSync(stagingPath, { recursive: true, force: true });
fs.mkdirSync(path.dirname(stagingPath), { recursive: true });
fs.cpSync(sourcePath, stagingPath, { recursive: true });
console.log('electron-utils staged: ' + sourcePath + ' -> ' + stagingPath);
