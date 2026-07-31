import { observer } from 'mobx-react-lite';
import {
    ExpandIcon,
    SettingIcon,
    RefreshIcon,
    PinIcon,
    FolderIcon,
    SearchIcon,
    EditIcon,
    InfoIcon,
} from '@wwf971/react-comp-misc';
import { startWindowDrag } from 'electron-utils/frontend';

// placeholder buttons filling the grid; a real app would put its own actions here
const buttonDemoList = [
    { id: 'setting', comp: SettingIcon },
    { id: 'refresh', comp: RefreshIcon },
    { id: 'pin', comp: PinIcon },
    { id: 'folder', comp: FolderIcon },
    { id: 'search', comp: SearchIcon },
    { id: 'edit', comp: EditIcon },
    { id: 'info', comp: InfoIcon },
];

// Shrink layout "button grid": a 4x2 grid of buttons, the top-left one being
// the expand button. Drag anywhere (buttons included) to move the window.
const SubAppCompactWindowButtonGrid = observer(({ store }) => {
    return (
        <div
            className="compact-window compact-grid-window"
            onMouseDown={(event) => startWindowDrag(event)}
        >
            <button
                className="compact-grid-btn"
                onMouseDown={(event) =>
                    startWindowDrag(event, { onClickWithoutDrag: () => store.compactWindow.exitCompact() })
                }
            >
                <ExpandIcon width={16} height={16} />
            </button>
            {buttonDemoList.map((buttonDemo) => {
                const IconComp = buttonDemo.comp;
                return (
                    <button key={buttonDemo.id} className="compact-grid-btn">
                        <IconComp width={16} height={16} />
                    </button>
                );
            })}
        </div>
    );
});

export default SubAppCompactWindowButtonGrid;
