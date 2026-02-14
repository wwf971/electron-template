# Electron React Template

An electron.hs project template that uses React.js as frontend.

## Project Structure

```
electron-react-template/
├── package.json           # Workspace root config
├── pnpm-workspace.yaml    # Workspace definition
├── backend/              # Electron main process
│   ├── package.json
│   ├── main.js            # Main process logic
│   └── preload.js         # Preload script (IPC bridge)
└── frontend/                 # React renderer process
    ├── package.json
    ├── vite.config.js     # Vite build config
    ├── index.html         # Entry HTML
    └── src/               # React source files
        ├── main.jsx       # React entry point
        ├── App.jsx        # Main App component
        └── styles.css     # Styling
```

## Installation

```bash
git clone https://github.com/wwf971/electron-react-template.git project_name
cd project_name
pnpm install
```

A reminder: it's good practice to rename project name and description in `package.json` and `frontend/package.json`, as well as `appId` and `productName` in `build-script/electron-builder-*.json`.

## Development

```bash
pnpm run build:frontend
pnpm run dev
```

## Build

Multi file builds go to `build/win` and `build/mac`

```bash
pnpm run build:all
pnpm run build:win
pnpm run build:mac
```

Single file builds go to `build-single`

```bash
pnpm run build:single:all
pnpm run build:single:win
pnpm run build:single:mac
```
