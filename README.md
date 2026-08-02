# Electron React Template

The project provides:
1. A template project(`/electron-template/`). An electron.js project template that uses React.js as frontend. It also servers as a gallary for features provided by `/electron-utils/`. Each feature demonstrated is implemented as a `sub-app`.

2. Some utilities(`/electron-utils/`). Mainly for general features that might be useful when developing electron.js apps.

For the develop pattern around this repo (who provides features, who imports them), see `/doc/electron-template-useage.md`. For how projects share frontend/backend/python code and stay aligned, see `/doc/code-share.md`. For the sync checklist after this template changes, see `./maintenance.md`.

## Repo Structure

This repo holds two separate things:

```
electron-template/         # repo root
├── README.md              # this file
├── doc/                   # documents: electron-template.md, code-share.md, electron-template-useage.md, ...
├── electron-template/     # scaffold: copy this folder to start a new app; also the demo app
│   ├── package.json       # workspace root config (build/dev scripts)
│   ├── backend/           # Electron main process
│   │   ├── main.js        # main process logic
│   │   ├── preload.js     # preload script (IPC bridge)
│   │   ├── electron-utils.js  # locates the electron-utils folder
│   │   └── sub-app/       # per-sub-app backend logic: <sub-app id>/{main.js, preload.js}
│   ├── frontend/          # React renderer process (vite): demo gallery + sub apps
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   ├── src/           # App.jsx, GalleryStore.js, ...
│   │   ├── sub-app/       # one entry component per basic sub app
│   │   └── sub-app-complex/   # compound sub apps (entry component + own store)
│   ├── data/              # default sub-app data files, deployed next to the executable (never overwritten);
│   │                      # two-layer: data-<id>.0.* holds authentic private data and is gitignored
│   └── build-script/      # electron-builder configs, cleanup and staging scripts
└── electron-utils/        # shared electron features, imported by apps (never copied)
    ├── backend/           # main-process modules, e.g. window-control.js, simple-config.js, simple-data.js, transparent-window.js
    ├── preload/           # preload bridges
    └── frontend/          # React components / helpers, e.g. window-compact.js, window-resize.js
```


## Scaffold and Demo

`/electron-template/` serves as both a scaffold and a demonstration of features provided by `/electron-utils/`. It builds into an app named `ElectronUtils` (`ElectronUtils.exe` on Windows), with the default menu bar hidden.

The demo window is frameless, with its own title bar rendered by the frontend (`frontend/src/TitleBar.jsx`). This is required by the compact-window demos: only a frameless window shrinks to a bare rectangle without any OS header.

For more information, refer to `./doc/electron-template.md`.

## Creating a New Project

```bash
git clone https://github.com/wwf971/electron-react-template.git electron-template
cp -r electron-template/electron-template project_name
cd project_name
pnpm install
```

A reminder: it's good practice to rename project name and description in `package.json` and `frontend/package.json`, as well as `appId` and `productName` in `build-script/electron-builder-*.json`.

The new project finds `electron-utils` in the `electron-template` repo sitting in the same workspace. On a machine without that workspace layout, add the `electron-template` repo as a git submodule under `third_party/` (see `./code-share.md`).

The commands below run at the project root (inside this repo, that is the inner `electron-template/` folder).

## Development

```bash
pnpm run build:frontend
pnpm run dev
```

## Build

Make sure the below commands is run at the inner `/electron-template` folder, not directly under the repo root dir. 
Multi file builds go to `build/win` and `build/mac`

```bash
pnpm run build:all
pnpm run build:win
pnpm run build:mac
```

Single file builds go to `build/win-single` and `build/mac-single`

```bash
pnpm run build:all:single
pnpm run build:win:single
pnpm run build:mac:single
```

By default the build does not wipe the output directory. Pass `--clear-build-dir` when you want a clean output folder first (e.g. after renaming the product / artifact, so old exes are not left beside the new ones):

```bash
pnpm run build:win -- --clear-build-dir
pnpm run build:all -- --clear-build-dir
```
