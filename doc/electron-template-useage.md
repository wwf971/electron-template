# Develop Pattern: Shared Features, Template, and Apps

This document describes how Electron apps are developed around this repo, so that common code is written once and imported everywhere, instead of copied around.

## How do apps/electorn-utils/electron-template work together?

```text
electron-utils/           provides common/general-purpose features
      ▲
      │ import
      │______________________________________
      |                                     │
electron-template/        each app repo (e.g. electron-transparent-text)
(scaffold + demo)         (real product, copied once from the scaffold)
```

- `electron-utils/` — the home of every feature that more than one app may want: always on top, compact window, window drag-to-move, window resize-by-dragging-edges, minimize/maximize/bounds control, stateless clipboard read/write, layered simple-config files, two-layer simple-data files, transparent windows, etc. One feature spans up to three layers (main process, preload, renderer), and all its parts live here together.
- `electron-template/` — the scaffold folder. Copy it to start a new app. It is also a runnable demo app (built as `ElectronUtils`): its entry page is a gallery of the features in `electron-utils/`, each opening as a sub app (see `../README.md#Scaffold and Demo`).
- **app repos** — independent repos like `electron-transparent-text`. They keep only app-specific logic, and import the common features from `electron-utils/`.

`react-comp-misc` (its own repo) plays the same "provider" role for electron-agnostic React components (icons, sliders, layout components). Both the demo app and the app repos import it at the frontend.

## Why import-based design, why not make app projects always copy the template?

The copy-based develop mode looks convenient at first: implement a feature inside the template (or inside one app), and copy the code into every project that wants it. Its real cost shows up on every later change:

```text
copy-based:   fix/improve feature ──▶ update template ──▶ re-copy into app A, app B, app C ...
import-based: fix/improve feature in electron-utils ──▶ done (all apps see it on next pull)
```

With the import-based pattern there is no duplicated feature code to keep aligned. The only thing still copied is the thin scaffold (folder structure, build scripts, wiring), which rarely changes; `../maintenance.md` covers syncing it.

## Typical Workflows

Start a new app:

```text
copy electron-template/ ──▶ rename identity fields (see ../README.md)
the wiring inside the scaffold already locates electron-utils and react-comp-misc
(workspace sibling first, third_party/ submodule as fallback; see ./code-share.md)
```

Add a common feature:

```text
implement in electron-utils/ (backend + preload + frontend parts as needed)
  ──▶ add a sub app for it in the demo gallery (electron-template/frontend/src/)
  ──▶ apps enable it with a few lines (register IPC, expose bridge, import component)
```

Fix a bug in a common feature:

```text
edit electron-utils/ once ──▶ every project using the workspace sibling sees it immediately
```

A feature only one app needs stays in that app. If it later turns out to be general (this is how always-on-top and compact-window started, inside `electron-transparent-text`), move it into `electron-utils/` and delete the app-local copy.

The reverse also happens: the clipboard cache started inside `electron-utils/`, but the cache is stateful and app-specific, so it moved into the demo app (`backend/sub-app/clipboard-cache/`); only the stateless clipboard read/write stayed in `electron-utils/`. In the demo app, each sub app keeps its backend logic under `backend/sub-app/<sub-app id>/` (see `./electron-template.md`).

## For More Details

- import mechanics, dual-source resolve, packaging: `./code-share.md`
- scaffold sync checklist after template changes: `../maintenance.md`
- demo app design (gallery, sub apps): `./electron-template.md`; build commands: `../README.md`
