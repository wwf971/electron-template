import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { galleryStore } from './GalleryStore.js';
import TitleBar from './TitleBar.jsx';
import GalleryPage from './GalleryPage.jsx';
import SubAppPage from './SubAppPage.jsx';
import SubAppCompactWindowExpandButton from '../sub-app/SubAppCompactWindowExpandButton.jsx';
import SubAppCompactWindowButtonGrid from '../sub-app/SubAppCompactWindowButtonGrid.jsx';
import SubAppClipboardCacheCompact from '../sub-app/SubAppClipboardCacheCompact.jsx';

// Page switching is fully driven by galleryStore:
// - a compact mode is on -> the window is a tiny frameless rectangle,
//   render only the compact layout of that sub app
// - subAppCurrentId set  -> render that sub app, as if it were a separate app
// - otherwise            -> render the gallery (entry page)
const App = observer(() => {
    const store = galleryStore;

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                store.exitToGallery();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [store]);

    if (store.compactWindow.isCompact) {
        if (store.compactWindow.layoutCurrentId === 'button-grid') {
            return <SubAppCompactWindowButtonGrid store={store} />;
        }
        return <SubAppCompactWindowExpandButton store={store} />;
    }
    if (store.clipboardCache.isCompact) {
        return <SubAppClipboardCacheCompact store={store} />;
    }

    return (
        <div className="app-shell">
            <TitleBar store={store} />
            {store.subAppCurrentId !== null ? (
                <SubAppPage store={store} />
            ) : (
                <GalleryPage store={store} />
            )}
        </div>
    );
});

export default App;
