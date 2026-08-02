import { makeAutoObservable, runInAction } from 'mobx';
import { CompactWindowStore } from './CompactWindowStore.js';
import { ClipboardCacheStore } from './ClipboardCacheStore.js';
import { PathManagerStore } from '../sub-app-complex/PathManagerStore.js';

// static info of each sub app shown in the gallery grid.
// kind 'basic': one focused feature demo (component under frontend/sub-app/)
// kind 'compound': application-level sub app (component under frontend/sub-app-complex/)
export const subAppList = [
    {
        id: 'always-on-top',
        kind: 'basic',
        name: 'Always On Top',
        desc: 'keep this window above all other windows',
    },
    {
        id: 'compact-window',
        kind: 'basic',
        name: 'Compact Window',
        desc: 'shrink the window to a small rectangle; drag it to move, click the expand button to restore',
    },
    {
        id: 'clipboard-cache',
        kind: 'basic',
        name: 'Clipboard Cache',
        desc: 'silently cache recent clipboard content (text or image), recover it after accidental overwrite',
    },
    {
        id: 'window-control',
        kind: 'basic',
        name: 'Window Control',
        desc: 'minimize / maximize the window, read its bounds',
    },
    {
        id: 'transparent-window',
        kind: 'basic',
        name: 'Transparent Window',
        desc: 'open a frameless window with transparent background; drag its header to move, drag its edges to resize',
    },
    {
        id: 'path-manager',
        kind: 'compound',
        name: 'Path Manager',
        desc: 'named path bookmarks: search, open, copy, edit; data + layered config stored next to the executable',
    },
];

// Source of truth for the whole demo app: which page is shown, the search text,
// and the ui state of every sub app. Simple sub apps keep their state in
// subAppStates; the bigger ones have their own store class (child stores here).
export class GalleryStore {
    searchText = '';
    subAppCurrentId = null; // null: the gallery page is shown
    subAppStates = {
        'always-on-top': { isOnTop: false },
        'window-control': { isMaximized: false, bounds: null },
        'transparent-window': { isOpen: false },
    };
    isTransparentWindowSubscribed = false; // 'closed' event subscribed once
    compactWindow = new CompactWindowStore();
    clipboardCache = new ClipboardCacheStore();
    pathManager = new PathManagerStore();

    constructor() {
        makeAutoObservable(this);
    }

    get subAppListFiltered() {
        const text = this.searchText.trim().toLowerCase();
        if (text === '') return subAppList;
        return subAppList.filter(
            (subApp) =>
                subApp.name.toLowerCase().includes(text) ||
                subApp.desc.toLowerCase().includes(text)
        );
    }

    get subAppListBasicFiltered() {
        return this.subAppListFiltered.filter((subApp) => subApp.kind === 'basic');
    }

    get subAppListCompoundFiltered() {
        return this.subAppListFiltered.filter((subApp) => subApp.kind === 'compound');
    }

    setSearchText(text) {
        this.searchText = text;
    }

    async openSubApp(subAppId) {
        this.subAppCurrentId = subAppId;
        if (!window.windowControl) return;
        if (subAppId === 'always-on-top') await this.refreshAlwaysOnTop();
        if (subAppId === 'window-control') await this.refreshBounds();
        if (subAppId === 'clipboard-cache') await this.clipboardCache.init();
        if (subAppId === 'path-manager') await this.pathManager.init();
        if (subAppId === 'transparent-window') await this.transparentWindowRefresh();
    }

    // bound to the Esc key: first leave compact mode if inside it, otherwise leave the sub app
    async exitToGallery() {
        if (this.compactWindow.isCompact) {
            await this.compactWindow.exitCompact();
            return;
        }
        if (this.clipboardCache.isCompact) {
            await this.clipboardCache.exitCompact();
            return;
        }
        this.subAppCurrentId = null;
    }

    // ---- always-on-top ----

    async refreshAlwaysOnTop() {
        const isOnTop = await window.windowControl.isAlwaysOnTop();
        runInAction(() => {
            this.subAppStates['always-on-top'].isOnTop = isOnTop;
        });
    }

    async setAlwaysOnTop(isOnTop) {
        const isOnTopNow = await window.windowControl.setAlwaysOnTop(isOnTop);
        runInAction(() => {
            this.subAppStates['always-on-top'].isOnTop = isOnTopNow;
        });
    }

    // ---- transparent-window (demo window of the transparent-window sub app) ----

    async transparentWindowRefresh() {
        if (!window.transparentWindow) return;
        if (!this.isTransparentWindowSubscribed) {
            this.isTransparentWindowSubscribed = true;
            // the demo window can also be closed by its own close button
            window.transparentWindow.onClosed(() => {
                runInAction(() => {
                    this.subAppStates['transparent-window'].isOpen = false;
                });
            });
        }
        const res = await window.transparentWindow.isOpen();
        runInAction(() => {
            this.subAppStates['transparent-window'].isOpen = res.data.isOpen;
        });
    }

    async transparentWindowOpen() {
        const res = await window.transparentWindow.open();
        runInAction(() => {
            this.subAppStates['transparent-window'].isOpen = res.code === 0;
        });
    }

    async transparentWindowClose() {
        await window.transparentWindow.close();
        runInAction(() => {
            this.subAppStates['transparent-window'].isOpen = false;
        });
    }

    // ---- window-control (also used by the custom title bar) ----

    async refreshBounds() {
        const bounds = await window.windowControl.getBounds();
        runInAction(() => {
            this.subAppStates['window-control'].bounds = bounds;
        });
    }

    async minimize() {
        await window.windowControl.minimize();
    }

    async toggleMaximize() {
        const isMaximized = await window.windowControl.toggleMaximize();
        runInAction(() => {
            this.subAppStates['window-control'].isMaximized = isMaximized;
        });
        await this.refreshBounds();
    }

    async closeWindow() {
        await window.windowControl.close();
    }
}

export const galleryStore = new GalleryStore();
