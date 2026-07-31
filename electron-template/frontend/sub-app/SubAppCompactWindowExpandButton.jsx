import { observer } from 'mobx-react-lite';
import { ExpandIcon } from '@wwf971/react-comp-misc';
import { startWindowDrag } from 'electron-utils/frontend';

// Shrink layout "expand button": the whole tiny window is one big expand button,
// with a visible border and a small margin inside the window border.
// Drag to move the window, click (without moving) to restore the normal size.
const SubAppCompactWindowExpandButton = observer(({ store }) => {
    return (
        <div className="compact-window compact-expand-window">
            <button
                className="compact-expand-btn"
                onMouseDown={(event) =>
                    startWindowDrag(event, { onClickWithoutDrag: () => store.compactWindow.exitCompact() })
                }
            >
                <ExpandIcon width="80%" height="80%" />
            </button>
        </div>
    );
});

export default SubAppCompactWindowExpandButton;
