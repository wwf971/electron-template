# Sharing Code Across Electron Projects

Multiple Electron apps are built from `electron-template` (for example `electron-transparent-text`). They want to share frontend UI components, backend (main process) logic, python helpers, and keep project configuration aligned. This document describes how, and why this design was chosen over alternatives (see [Strategy Comparison](#strategy-comparison)).

## Core Concepts

Everything in an Electron project belongs to one of three kinds, and each kind is shared in a different way:

| Kind | Examples | How it is shared |
|------|----------|------------------|
| Scaffold | folder structure, root `package.json` scripts, `build-script/`, `.gitignore` | copied from template when project is created, then kept aligned by diff-sync (`maintenance.md`) |
| Shared runtime code | React components, window-control IPC, python runner | lives in shared packages, imported by each project, updated by `git pull` |
| App code | this app's `main.js` logic, `frontend/src/` | project-specific, never synced |

```text
electron-template repo
├── electron-template/ ──(copy once, occasional diff-sync)──▶ each app repo
└── electron-utils/    ◀──(import: electron features)─────── backend + preload + frontend
       react-comp-misc ◀──(import: pure UI)───────────────── frontend
```

Guiding principle: **keep the scaffold thin**. Scaffold can only be shared by copy-and-sync, which is manual work. So any code with real logic should live in a shared package instead, where one `git pull` updates it. The scaffold then changes rarely, and template sync stays a small chore.

The shared packages are:

- `react-comp-misc` — its own repo. Electron-agnostic React components, also used by web projects (e.g. `apart-manage`).
- `electron-utils` — lives inside the `electron-template` repo, next to the inner `electron-template/` folder (the scaffold). Both are general-purpose utility things, so they share one repo. It holds electron-specific shared code: main-process features, preload bridges, and optional React components that call them.

Each app remains an independent git repo (own history, own release, own GitHub page).

## Where Should a New Feature Go

```text
new feature
  ├─ pure UI, would also work in a browser?        ──▶ react-comp-misc
  ├─ needs Electron (ipcMain / preload / window)?  ──▶ electron-utils
  ├─ build command / folder / script convention?   ──▶ electron-template/ scaffold
  └─ only makes sense in this one app?             ──▶ the app repo itself
```

Example: "keep window always on top" (first written inside `electron-transparent-text`) needs an `ipcMain` handler, a preload bridge, and a toggle button. It is a general Electron feature, so all three parts belong in `electron-utils`. Every app then enables it with a few lines, instead of copying the code.

## The Dual-Source Import

A shared package could be a git submodule under `third_party/` in each project. But that puts multiple copies of the same repo in the dev workspace, introducing inconvenicens, such as:

- file navigation becomes error-prone. files in original and in copies all appear in file search results in dev workspace, and we need to be very careful to go to the file in original repo, not in copies.

- and fixing a small bug means edit original → commit → update every copy(exists as submodule in multiple projects)

The fix: each shared package has two possible sources, and a resolve script picks one automatically before dev/build:

```text
resolve order:
  1. sibling repo in workspace   e.g. /project/2025/react-comp-misc            ← dev machine
                                      /project/2025/electron-template/electron-utils
  2. third_party/ submodule inside the project                                 ← standalone clone / deploy
```

- Static config always declares the `third_party/` path (e.g. `"@wwf971/react-comp-misc": "file:../third_party/react-comp-misc"` in `package.json`). The resolve script never rewrites the static config; on the dev machine it only rewires `node_modules` (symlink) / vite alias to the sibling repo.
- On the dev machine, do **not** run `git submodule update --init`. The `third_party/` folders stay empty, so there is exactly one copy of each shared repo in the workspace.
- On any other machine, init the submodules and the pinned versions are used.

So the bug-fix workflow becomes: edit the sibling repo once → all projects see the change immediately → commit in the shared repo → bump each project's submodule pointer whenever that project wants to pin the new version.

For `electron-utils`, the submodule is the whole `electron-template` repo (under `third_party/electron-template/`), which also gives the app a reference copy of the scaffold to diff against. Since its consumers span three layers, each layer has its own small resolver instead of one `node_modules` rewiring; see [Sharing Backend](#sharing-backend).

Working example of the wiring: `apart-manage/frontend/main/vite.config.ts` (alias with `fs.existsSync` fallback) and `apart-manage/frontend/main/script/resolve-react-comp-misc.mjs` (pre-dev/pre-build hook). The template carries the same wiring so new projects get it for free.

## Sharing Frontend

`react-comp-misc` is imported **by source**: its `package.json` `exports` point at `./src/*`, there is no build step, and the consuming app's vite compiles it together with app code. Electron apps consume it exactly like `apart-manage` does (vite alias + resolve script, dual-source).

Components that need a preload-exposed API (e.g. an always-on-top toggle button) are not usable in a browser, so they go in `electron-utils/frontend/`, not in `react-comp-misc`. They are still imported by source and bundled by vite, so they need no special packaging.

## Sharing Backend

An Electron feature usually spans three layers. `electron-utils` keeps the three parts of one feature together, one folder per layer:

```text
electron-utils/
├── package.json
├── backend/                    # main-process modules (CommonJS)
│   ├── index.js                # re-exports all backend features
│   ├── window-control.js       # registerWindowControlIpc(): always-on-top,
│   │                           # minimize/maximize, bounds, min-size, resizable, close
│   └── clipboard-cache.js      # registerClipboardCacheIpc(): silently polls the system
│                               # clipboard, caches the last N contents (text or image),
│                               # notifies every window of new entries
├── preload/
│   ├── index.js
│   ├── window-control.js       # exposeWindowControl(): window.windowControl.*
│   └── clipboard-cache.js      # exposeClipboardCache(): window.clipboardCache.*
└── frontend/                   # React components / helpers, bundled by the app's vite
    ├── index.jsx
    ├── AlwaysOnTopToggle.jsx   # one ready-made UI calling window.windowControl
    ├── window-compact.js       # enterCompactWindow()/exitCompactWindow(): shrink the
    │                           # window to a small rectangle (on top by default)
    │                           # and restore it later
    └── window-drag.js          # startWindowDrag(): move the window by dragging any
                                # element; a click without movement acts as a button
```

Supplements: electron.js three-layer architecture:

```text
      Operating System
            ▲
            │
  ┌────────────────────┐
  │    Main Process    │
  │     (Backend)      │
  │   Node.js Runtime  │
  └─────────┬──────────┘
            │   IPC
  ┌─────────▼──────────┐
  │      Preload       │
  │    (Bridge Layer)  │
  │ Node.js + Browser  │
  └─────────┬──────────┘
            │ contextBridge
  ┌─────────▼──────────┐
  │  Renderer Process  │
  │    (Frontend)      │
  │ Browser Environment│
  └────────────────────┘
```

### Layers stay independent and general-purpose

Each layer must be usable on its own, and must not assume one particular caller:

- **backend** is a plain IPC API with general parameters. Handlers operate on the window that sent the request (`BrowserWindow.fromWebContents(event.sender)`), so they need no window reference and make no assumption about which UI calls them.
- **preload** is a thin mapping only: one function per IPC channel, exposed as `window.windowControl.*`. No logic of its own.
- **frontend** components are optional convenience — just one consumer of the exposed API. An app is free to skip them and trigger the same backend feature from its own button, tray menu, or keyboard shortcut, in whatever form it likes.

### Wiring in an app

Each layer imports `electron-utils` through the scaffold wiring (all part of the scaffold folder):

```js
// backend/main.js — backend/electron-utils.js locates the electron-utils folder
// (packaged resources → this repo → workspace sibling → third_party submodule)
const { requireElectronUtils } = require('./electron-utils.js');
const { registerWindowControlIpc } = requireElectronUtils('backend');
registerWindowControlIpc();

// backend/preload.js
const { exposeWindowControl } = requireElectronUtils('preload');
exposeWindowControl(contextBridge, ipcRenderer);
```

```jsx
// frontend — vite.config.js aliases 'electron-utils/frontend' with the same source fallback
import { AlwaysOnTopToggle } from 'electron-utils/frontend'
```

Two packaging notes:

- Unlike frontend code (bundled by vite), backend and preload files ship as real files. Before packaging, `build-script/resolve-electron-utils.js` copies the resolved `electron-utils` into `build/electron-utils`, and the builder configs ship that fixed path via `extraResources`. The packaged app then finds it at `process.resourcesPath/electron-utils` (first candidate of `backend/electron-utils.js`).
- The preload requires local files, so the `BrowserWindow` sets `sandbox: false` in `webPreferences`.

## Python at Backend

Conventions for runtime python called by the packaged app:

- App-specific scripts live in `backend/python/`.
- The builder config lists `backend/python/` in `extraResources`, so scripts ship as plain files next to the app.
- `runPython(scriptName, args)` in `electron-utils/backend/python-run.js` resolves the script path (dev: `backend/python/`; packaged: `process.resourcesPath/python/`), spawns the interpreter, and returns stdout/exit code.
- Shared python utility code is a shared package too, consumed dual-source like the JS packages, and copied into `extraResources` at build.

The interpreter is the machine's `python3`; the app should check for it and show a clear error if missing. Bundling an interpreter (python embeddable, pyinstaller) is heavy and only worth doing per-project when target machines cannot be assumed to have python.

## Keeping Projects Aligned

The inner `electron-template/` folder stays the source of truth for scaffold files only. `maintenance.md` lists exactly which files to diff and which fields are project identity (appId, productName, names) and must not be overwritten.

To make future diffs start from the right base, each app's README records the template commit it was last synced to:

```text
based on electron-template @ <commit-hash>
```

Because logic keeps moving out of the scaffold into shared packages, the checklist in `maintenance.md` should only shrink over time.

## Strategy Comparison

Three strategies were considered. The chosen one is a combination: **independent app repos + shared packages with dual-source import + thin copied scaffold.**

### Chosen strategy

- Pros: each app has independent repo/release/history; shared logic updated by `git pull`, no per-project copying; one copy of each shared repo in the dev workspace; standalone clone still works via submodules.
- Cons: scaffold still needs manual diff-sync (kept small by the thin-scaffold principle); submodule pointers need occasional bumping; resolve-script wiring is extra machinery each project must carry (but it comes from the template, written once).

### Alternative A: one monorepo, all apps as subfolders (or one bundled app)

- Pros: zero sync work, sharing is trivial (same workspace), one `pnpm install`.
- Cons: no independent repo per app — mixed git history, cannot open-source or release one app alone, CI touches everything; a single bundled app keeps growing and unrelated tools become coupled through shared dependency upgrades.
- Note: "one app bundling many small OA tools" is not really a repo strategy — it is simply one app. It fits when the tools are tiny and want a common launcher, and such a bundle app can exist as one ordinary project inside the chosen strategy. It does not help apps that must be standalone products with their own window behavior (e.g. `electron-transparent-text`).

### Alternative B: the whole template as a submodule under `third_party/`

- Pros: template updates arrive by `git pull`, no diff-sync.
- Cons: the scaffold is exactly the part that **cannot be imported**. Root `package.json` scripts, `build-script/` paths, and builder configs must exist at the project root and carry project identity (appId, productName). Sharing them through a submodule needs a generation/indirection layer (scripts that `cd` into the submodule, configs generated from a per-project identity file), which trades a small rarely-changing diff-sync for permanent indirection that is harder to read. And the multiple-copies workspace pollution applies in full, since scaffold has no dual-source escape.
- Conclusion: submodules fit importable runtime code, not scaffold. The chosen strategy does include `electron-template` as a submodule on standalone machines — but only to import `electron-utils/` from it; the scaffold folder is still copied, never imported.

### Alternative C: publish shared packages to an npm registry

- Pros: proper version pinning, standard tooling, no submodules at all.
- Cons: every small fix needs a publish step before any app can use it, which kills iteration speed for personal repos; a private registry adds infrastructure.
- The dual-source import gives the same "edit once, use everywhere" during development, while submodule pointers already provide version pinning for deployment.
