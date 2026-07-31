import { makeAutoObservable, runInAction } from 'mobx';
import { enterCompactWindow, exitCompactWindow } from 'electron-utils/frontend';

// min size given back to the window when leaving compact mode
export const sizeMinNormal = { width: 300, height: 200 };

// the shrink layouts demonstrated by the Compact Window sub app
export const layoutList = [
    {
        id: 'expand-button',
        name: 'expand button',
        sizeCompact: { width: 96, height: 80 },
    },
    {
        id: 'button-grid',
        name: 'button grid',
        sizeCompact: { width: 148, height: 84 },
    },
];

// ui state of the Compact Window sub app
export class CompactWindowStore {
    layoutCurrentId = 'expand-button';
    isOnTopWhenCompact = true;
    isCompact = false;
    stateSaved = null; // window state before shrinking, given back on exit

    constructor() {
        makeAutoObservable(this);
    }

    get layoutCurrent() {
        return layoutList.find((layout) => layout.id === this.layoutCurrentId);
    }

    setLayoutCurrentId(layoutId) {
        this.layoutCurrentId = layoutId;
    }

    setIsOnTopWhenCompact(isOnTop) {
        this.isOnTopWhenCompact = isOnTop;
    }

    async enterCompact() {
        const stateSaved = await enterCompactWindow({
            width: this.layoutCurrent.sizeCompact.width,
            height: this.layoutCurrent.sizeCompact.height,
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
