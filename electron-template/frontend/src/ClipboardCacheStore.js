import { makeAutoObservable, runInAction } from 'mobx';
import { enterCompactWindow, exitCompactWindow } from 'electron-utils/frontend';
import { sizeMinNormal } from './CompactWindowStore.js';

// the clipboard viewer needs more room than a plain expand button
export const sizeCompactClipboard = { width: 260, height: 200 };

// ui state of the Clipboard Cache sub app. The cache itself lives in the
// backend (backend/sub-app/clipboard-cache); this store mirrors the entries
// and adds the player state (which entry is shown).
export class ClipboardCacheStore {
    entries = []; // newest first, mirrored from backend
    cacheSize = 5;
    indexCurrent = 0; // index into entries; 0 = latest
    isCompact = false;
    isOnTopWhenCompact = true;
    stateSaved = null;
    isInited = false;

    constructor() {
        makeAutoObservable(this);
    }

    get entryCurrent() {
        return this.entries[this.indexCurrent] ?? null;
    }

    // called when the sub app is first opened; keeps listening afterwards
    async init() {
        if (this.isInited || !window.clipboardCache) return;
        this.isInited = true;
        const res = await window.clipboardCache.getEntries();
        if (res.code === 0) {
            runInAction(() => {
                this.entries = res.data.entries;
                this.cacheSize = res.data.cacheSize;
            });
        }
        window.clipboardCache.onEntryNew((entry) => this.onEntryNew(entry));
    }

    onEntryNew(entry) {
        this.entries.unshift(entry);
        this.entries = this.entries.slice(0, this.cacheSize);
        // viewing the latest: follow the new entry. viewing an older one: keep showing it
        if (this.indexCurrent > 0) {
            this.indexCurrent += 1;
        }
        if (this.indexCurrent > this.entries.length - 1) {
            this.indexCurrent = this.entries.length - 1;
        }
    }

    goEarlier() {
        if (this.indexCurrent < this.entries.length - 1) this.indexCurrent += 1;
    }

    goLater() {
        if (this.indexCurrent > 0) this.indexCurrent -= 1;
    }

    goLatest() {
        this.indexCurrent = 0;
    }

    setIndexCurrent(index) {
        this.indexCurrent = index;
    }

    setIsOnTopWhenCompact(isOnTop) {
        this.isOnTopWhenCompact = isOnTop;
    }

    async setCacheSize(size) {
        const res = await window.clipboardCache.setCacheSize(size);
        if (res.code !== 0) return;
        runInAction(() => {
            this.cacheSize = res.data;
            this.entries = this.entries.slice(0, this.cacheSize);
            if (this.indexCurrent > this.entries.length - 1) {
                this.indexCurrent = Math.max(0, this.entries.length - 1);
            }
        });
    }

    // write a cached entry back to the system clipboard
    async applyEntry(entryId) {
        await window.clipboardCache.applyEntry(entryId);
    }

    async enterCompact() {
        const stateSaved = await enterCompactWindow({
            width: sizeCompactClipboard.width,
            height: sizeCompactClipboard.height,
            isOnTop: this.isOnTopWhenCompact,
        });
        runInAction(() => {
            this.isCompact = true;
            this.stateSaved = stateSaved;
        });
    }

    async exitCompact() {
        await exitCompactWindow({
            stateSaved: this.stateSaved,
            minWidth: sizeMinNormal.width,
            minHeight: sizeMinNormal.height,
        });
        runInAction(() => {
            this.isCompact = false;
            this.stateSaved = null;
        });
    }
}
