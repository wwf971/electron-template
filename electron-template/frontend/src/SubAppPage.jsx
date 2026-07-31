import { observer } from 'mobx-react-lite';
import { BackIcon } from '@wwf971/react-comp-misc';
import { subAppList } from './GalleryStore.js';
import SubAppAlwaysOnTop from '../sub-app/SubAppAlwaysOnTop.jsx';
import SubAppCompactWindow from '../sub-app/SubAppCompactWindow.jsx';
import SubAppClipboardCache from '../sub-app/SubAppClipboardCache.jsx';
import SubAppWindowControl from '../sub-app/SubAppWindowControl.jsx';

// Renders the current sub app full-window, as if a separate app was launched.
// Every sub app gets the same header: exit button + feature name.
const SubAppPage = observer(({ store }) => {
    const subApp = subAppList.find((item) => item.id === store.subAppCurrentId);

    return (
        <div className="subapp-page">
            <div className="subapp-header">
                <button className="btn" onClick={() => store.exitToGallery()}>
                    <BackIcon width={14} height={14} />
                    <span>gallery</span>
                </button>
                <span className="subapp-title">{subApp.name}</span>
            </div>
            <div className="subapp-body">
                {subApp.id === 'always-on-top' && <SubAppAlwaysOnTop store={store} />}
                {subApp.id === 'compact-window' && <SubAppCompactWindow store={store} />}
                {subApp.id === 'clipboard-cache' && <SubAppClipboardCache store={store} />}
                {subApp.id === 'window-control' && <SubAppWindowControl store={store} />}
            </div>
        </div>
    );
});

export default SubAppPage;
