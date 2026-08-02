



### Sub Apps

The features in `/electron-utils/` are mostly unrelated to each other (always on top, compact window, window control, ...), so each one is demonstrated separately, as a **sub app**:

```text
entry page (gallery)                          sub app
┌──────────────────────────┐                 ┌───────────────────────────┐
│ [search bar............] │  click a card   | [<-gallery]  feature name |
│ ┌──────┐ ┌──────┐ ┌────┐ │ ──────────────> |                           |
│ │always│ │compac│ │wind│ │                 |   demo of this feature    │
│ │on top│ │window│ │ctrl│ │ <────────────── │                           │
│ └──────┘ └──────┘ └────┘ │  exit button    └───────────────────────────┘
└──────────────────────────┘  or Esc key
```

Opening a sub app looks like launching a separate app: it takes the whole window and shows only that feature. Every sub app has an exit-to-gallery button (acceptable, since sub apps are demonstrations, not products). The `Esc` key also exits, and this key is written explicitly on the entry page — some demos (e.g. compact window) hide the normal UI, and without knowing the key the user could get stuck.

### Basic and Compound Sub Apps

Sub apps come in two kinds, shown as two titled sections on the entry page. Each section title line carries an info icon (`InfoIconWithTooltip` from `react-comp-misc`) explaining the kind, and the title lines stay visible in search results:

```text
basic app [i] ------------------------
[always][compact][clip][window]
compound app [i] ---------------------
[path manager]
```

- **basic app** — demonstrates one focused feature, usually provided by `electron-utils/` (always on top, compact window, clipboard cache, window control, transparent window). The transparent-window sub app opens a second frameless transparent window; the nuances behind transparent windows (gpu switches on windows, no shadow on macos, manual move/resize) are documented in `electron-utils/backend/transparent-window.js`.
- **compound app** — closer to application level: not a demo of one feature, but a small tool combining several features and owning its own data / config. Example: Path Manager (absorbed from the old `app_electron` project).

Apart from the grouping on the entry page, both kinds are treated equally: same gallery card, same sub-app page, same `Esc`-to-exit.

### Where a Sub App's Code Lives

Each sub app keeps its layer-specific logic in a folder/file named after it, so it is always clear where the separate logic of one sub app lies:

| layer | location |
|---|---|
| frontend, basic app | `frontend/sub-app/SubApp<Name>.jsx` (+ a store class in `frontend/src/` if the state is big) |
| frontend, compound app | `frontend/sub-app-complex/` (component + its own store files) |
| main process | `backend/sub-app/<sub-app id>/main.js` |
| preload bridge | `backend/sub-app/<sub-app id>/preload.js` |

A sub app that needs no backend simply has no `backend/sub-app/<id>/` folder. `backend/main.js` calls each sub app's IPC register function; `backend/preload.js` calls each bridge's expose function.

Only stateless general-purpose building blocks stay in `electron-utils/`. Example: the clipboard-cache sub app keeps its polling cache (stateful, app-specific) in `backend/sub-app/clipboard-cache/`, while `electron-utils/backend/clipboard.js` provides only stateless clipboard read/write.

### Sub App Data and Config

Deployed executables sit in a subfolder per build mode (`<dest>/single/`, `<dest>/multi/`), so all build modes share the folders next to them:

- **data** — `${dirExe}/../data/` is the default folder for sub-app data files, named `data-<sub-app id>.<ext>` (e.g. `data-path-manager.yaml`). The repo's `data/` folder holds the defaults; the deploy scripts (`copy_to_dest*.py`) copy it to `<dest>/data/` but never overwrite an existing file, so user data survives re-deploys (no more replacing files inside `resources/` by hand).
- **config** — json-like `.jsonc` files handled by the **simple-config** feature of `electron-utils` (scan folders with `${dirExe}` token support, stack layer by layer in a caller-chosen order, entry-level CRUD on one file). The path-manager sub app searches `config-path-manager.jsonc` in the exe folder, its parent, and its grandparent, and stacks them with priority grandparent > parent > exe folder (the order itself is app-specific logic, not fixed in electron-utils). Its config page is rendered with the config-panel components of `react-comp-misc` (`ConfigPanel` + custom value cells); the page also shows the parse result of the data file layers described below.

In dev mode `${dirExe}` is anchored to `<project root>/dev-run` (a pseudo folder), so the data folder resolves to `<project root>/data/`.

### Two-Layer Data Files

A sub-app data file has two layers, similar to the two-layer config files (`config.0.*` beside `config.*`), so authentic private data never needs to enter git:

- `data-<sub-app id>.0.<ext>` — authentic (often private) data, gitignored
- `data-<sub-app id>.<ext>` — example data, safe to commit

Unlike config layers, data layers are **not merged**: one file is picked, and that same file is used for all CRUD (both read and write):

```text
data file load (path-manager as example)
  -> data-path-manager.0.yaml exists and parses ok? -> use it
  -> else: data-path-manager.yaml exists?           -> use it
  -> else: create data-path-manager.0.yaml with template content, use it
  -> finally: copy the used file to a backup file (see below)
```

Each time a data file is loaded, the used file is copied to `<full file name>.<time stamp>.bak` in the same folder, e.g. `data-path-manager.0.yaml.20260520_23250530+09.bak` (time stamp precision 10 ms, `+09` = UTC+9). Backup files are gitignored.

The layer mechanics live in the **simple-data** feature of `electron-utils` (`backend/simple-data.js`). Parsing is file-format specific and stays with the sub app (yaml for path-manager), so the module takes a parse function from the caller.

### Design choice: one app with sub apps, not one build target per feature

Two approaches were considered for demonstrating multiple unrelated features:

1. **One app: gallery entry page + sub apps (chosen).** One build, one installed copy on disk; switching to another feature happens inside the same app, no need to launch anything else. The Esc key provides a uniform escape from any demo.
2. **Multiple build targets, one small app per feature.** Each demo stays trivially simple, but disk space multiplies with feature count, each new feature adds builder configs/build scripts to maintain, and viewing another feature means opening another app.

The gallery costs a little frontend code (a page switch driven by one store), which is much cheaper than maintaining N build targets. This also matches the "assortment of small OA/utility tools in one app" usage, so the demo app doubles as a working example of that app style.