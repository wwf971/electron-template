import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

// Locates the electron-utils folder (shared electron features, lives in the
// electron-template repo). Checked in order:
const electronUtilsCandidates = [
  // 1. this project is the electron-template repo itself
  path.resolve(__dirname, '../../electron-utils'),
  // 2. dev workspace: electron-template repo sits at /project/2025/electron-template
  path.resolve(__dirname, '../../../2025/electron-template/electron-utils'),
  // 3. standalone clone: electron-template repo as git submodule under third_party/
  path.resolve(__dirname, '../third_party/electron-template/electron-utils'),
]
const electronUtilsPath = electronUtilsCandidates.find((candidatePath) => fs.existsSync(candidatePath))

if (!electronUtilsPath) {
  throw new Error('electron-utils not found. Checked:\n' + electronUtilsCandidates.join('\n'))
}

// Locates react-comp-misc (shared electron-agnostic React components, its own
// repo), imported by source. Checked in order:
const reactCompMiscCandidates = [
  // 1. this project is the electron-template repo itself: react-comp-misc sits next to the repo
  path.resolve(__dirname, '../../../react-comp-misc'),
  // 2. dev workspace: react-comp-misc repo sits at /project/2025/react-comp-misc
  path.resolve(__dirname, '../../../2025/react-comp-misc'),
  // 3. standalone clone: react-comp-misc as git submodule under third_party/
  path.resolve(__dirname, '../third_party/react-comp-misc'),
]
const reactCompMiscPath = reactCompMiscCandidates.find(
  (candidatePath) => fs.existsSync(path.join(candidatePath, 'package.json'))
)

if (!reactCompMiscPath) {
  throw new Error('react-comp-misc not found. Checked:\n' + reactCompMiscCandidates.join('\n'))
}

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  optimizeDeps: {
    exclude: ['@wwf971/react-comp-misc'],
  },
  resolve: {
    alias: [
      { find: /^electron-utils\/frontend$/, replacement: path.join(electronUtilsPath, 'frontend/index.jsx') },
      { find: /^@wwf971\/react-comp-misc$/, replacement: path.join(reactCompMiscPath, 'src/index.js') },
    ],
    // shared source is compiled together with app code; make sure only one copy
    // of react/mobx (the app's) ends up in the bundle
    dedupe: ['react', 'react-dom', 'mobx', 'mobx-react-lite'],
  },
  build: {
    outDir: 'build',
    emptyOutDir: true
  }
})
