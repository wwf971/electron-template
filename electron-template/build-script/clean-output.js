const fs = require('fs');
const path = require('path');

// Delete all items under build output dir before electron-builder writes into it.
// Without this, renaming productName / artifactName leaves the old exe
// (and other leftover files) sitting next to the new ones.
//
// Only runs when --clear-build-dir is given (see run-build.js / package scripts):
//   pnpm run build:win -- --clear-build-dir
const args = process.argv.slice(2).filter((item) => item !== '--');
const relativePath = args.find((item) => !item.startsWith('--'));
const shouldClear = args.includes('--clear-build-dir');

if (!relativePath) {
    console.error('usage: node clean-output.js <relative-output-dir> [--clear-build-dir]');
    process.exit(1);
}

if (!shouldClear) {
    process.exit(0);
}

const outputPath = path.resolve(__dirname, relativePath);
fs.rmSync(outputPath, { recursive: true, force: true });
fs.mkdirSync(outputPath, { recursive: true });
console.log('cleaned: ' + outputPath);
