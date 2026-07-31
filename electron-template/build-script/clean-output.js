const fs = require('fs');
const path = require('path');

// Delete all items under build output dir before electron-builder writes into it.
// Without this, renaming productName / artifactName leaves the old exe
// (and other leftover files) sitting next to the new ones.
const relativePath = process.argv[2];
if (!relativePath) {
    console.error('usage: node clean-output.js <relative-output-dir>');
    process.exit(1);
}

const outputPath = path.resolve(__dirname, relativePath);
fs.rmSync(outputPath, { recursive: true, force: true });
fs.mkdirSync(outputPath, { recursive: true });
console.log('cleaned: ' + outputPath);
