import { observer } from 'mobx-react-lite';
import { CollapseIconHorizontal, BoolSlider, SegmentedControl } from '@wwf971/react-comp-misc';
import { layoutList } from '../src/CompactWindowStore.js';

// Expanded page of the Compact Window sub app: pick a shrink layout, then shrink.
// The shrink layouts themselves are SubAppCompactWindowExpandButton.jsx and
// SubAppCompactWindowButtonGrid.jsx, rendered by App.jsx while isCompact.
const SubAppCompactWindow = observer(({ store }) => {
    if (!window.windowControl) {
        return <div className="subapp-note">window.windowControl is not available (not running inside Electron).</div>;
    }
    const storeCompact = store.compactWindow;
    const layout = storeCompact.layoutCurrent;

    return (
        <div className="subapp-content">
            <p className="subapp-desc">
                Shrinks the window to a small frameless rectangle. Drag the rectangle to move
                the window. Click its expand button, or press Esc, to restore the previous size.
            </p>
            <div className="feature-row">
                <span className="feature-label">shrink layout</span>
                <SegmentedControl
                    data={{
                        valueSelected: storeCompact.layoutCurrentId,
                        segList: layoutList.map((item) => ({ value: item.id, labelText: item.name })),
                    }}
                    onEvent={(eventType, eventData) => {
                        if (eventType === 'valueSelectedChange') {
                            storeCompact.setLayoutCurrentId(eventData.valueSelected);
                        }
                    }}
                />
            </div>
            <div className="feature-row">
                <span className="feature-label">always on top while shrinked</span>
                <BoolSlider
                    checked={storeCompact.isOnTopWhenCompact}
                    onChange={(isChecked) => storeCompact.setIsOnTopWhenCompact(isChecked)}
                />
            </div>
            <div className="btn-row">
                <button className="btn" onClick={() => storeCompact.enterCompact()}>
                    <CollapseIconHorizontal width={14} height={14} />
                    <span>shrink to {layout.sizeCompact.width} x {layout.sizeCompact.height}</span>
                </button>
            </div>
        </div>
    );
});

export default SubAppCompactWindow;
