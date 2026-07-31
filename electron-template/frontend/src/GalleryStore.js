import { makeAutoObservable, runInAction } from 'mobx';
import { CompactWindowStore } from './CompactWindowStore.js';
import { ClipboardCacheStore } from './ClipboardCacheStore.js';

// static info of each sub app shown in the gallery grid
export const subAppList = [
    {
        id: 'always-on-top',
        name: 'Always On Top',
        desc: 'keep this window above all other windows',
    },
    {
        id: 'compact-window',
        name: 'Compact Window',
        desc: 'shrink the window to a small rectangle; drag it to move, click the expand button to restore',
    },
    {
        id: 'clipboard-cache',
        name: 'Clipboard Cache',
        desc: 'silently cache recent clipboard content (text or image), recover it after accidental overwrite',
    },
    {
        id: 'window-control',
        name: 'Window Control',
        desc: 'minimize / maximize the window, read its bounds',
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
    };
    compactWindow = new CompactWindowStore();
    clipboardCache = new ClipboardCacheStore();

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

    setSearchText(text) {
        this.searchText = text;
    }

    async openSubApp(subAppId) {
        this.subAppCurrentId = subAppId;
        if (!window.windowControl) return;
        if (subAppId === 'always-on-top') await this.refreshAlwaysOnTop();
        if (subAppId === 'window-control') await this.refreshBounds();
        if (subAppId === 'clipboard-cache') await this.clipboardCache.init();
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
