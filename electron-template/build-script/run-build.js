const { spawnSync } = require('child_process');
const path = require('path');

// Runs electron-builder + post cleanup for one or more targets.
// Forwards --clear-build-dir to clean-output.js (off by default).
//
// usage:
//   node run-build.js win [--clear-build-dir]
//   node run-build.js win mac [--clear-build-dir]
//
// from package scripts:
//   pnpm run build:win -- --clear-build-dir

const targetMap = {
    win: {
        outputDir: '../build/win',
        platformArgs: ['--win'],
        config: '../build-script/electron-builder-dir-win.json',
        cleanup: 'cleanup.js',
    },
    mac: {
        outputDir: '../build/mac',
        platformArgs: ['--mac'],
        config: '../build-script/electron-builder-dir-mac.json',
        cleanup: 'cleanup.js',
    },
    'win-single': {
        outputDir: '../build/win-single',
        platformArgs: ['--win'],
        config: '../build-script/electron-builder-single-win.json',
        cleanup: 'cleanup-single.js',
    },
    'mac-single': {
        outputDir: '../build/mac-single',
        platformArgs: ['--mac'],
        config: '../build-script/electron-builder-single-mac.json',
        cleanup: 'cleanup-single.js',
    },
};

const args = process.argv.slice(2).filter((item) => item !== '--');
const clearBuildDir = args.includes('--clear-build-dir');
const targetNames = args.filter((item) => !item.startsWith('--'));

if (targetNames.length === 0) {
    console.error('usage: node run-build.js <win|mac|win-single|mac-single>... [--clear-build-dir]');
    process.exit(1);
}

function run(command, commandArgs) {
    const result = spawnSync(command, commandArgs, {
        cwd: __dirname,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

for (const name of targetNames) {
    const target = targetMap[name];
    if (!target) {
        console.error('unknown target: ' + name);
        process.exit(1);
    }

    if (clearBuildDir) {
        run('node', ['clean-output.js', target.outputDir, '--clear-build-dir']);
    }

    run('pnpm', [
        '--dir',
        path.resolve(__dirname, '../backend'),
        'exec',
        'electron-builder',
        ...target.platformArgs,
        '--config',
        target.config,
    ]);
    run('node', [target.cleanup]);
}
