import { observer } from 'mobx-react-lite';
import {
    CollapseIconHorizontal,
    BoolSlider,
    PlusIcon,
    MinusIcon,
} from '@wwf971/react-comp-misc';

// Expanded page of the Clipboard Cache sub app: settings + the cached entry
// list. The shrunk player is SubAppClipboardCacheCompact.jsx.
const SubAppClipboardCache = observer(({ store }) => {
    if (!window.clipboardCache) {
        return <div className="subapp-note">window.clipboardCache is not available (not running inside Electron).</div>;
    }
    const storeClip = store.clipboardCache;

    return (
        <div className="subapp-content">
            <p className="subapp-desc">
                The backend silently listens to the system clipboard and caches the last {storeClip.cacheSize} contents
                (text or image), without bothering you. If important clipboard content gets overwritten,
                recover it here: click an entry to view it, and apply it back to the clipboard.
            </p>
            <div className="feature-row">
                <span className="feature-label">cache size</span>
                <button className="btn-icon" onClick={() => storeClip.setCacheSize(storeClip.cacheSize - 1)}>
                    <MinusIcon width={14} height={14} />
                </button>
                <span className="cache-size-value">{storeClip.cacheSize}</span>
                <button className="btn-icon" onClick={() => storeClip.setCacheSize(storeClip.cacheSize + 1)}>
                    <PlusIcon width={14} height={14} />
                </button>
            </div>
            <div className="feature-row">
                <span className="feature-label">always on top while shrinked</span>
                <BoolSlider
                    checked={storeClip.isOnTopWhenCompact}
                    onChange={(isChecked) => storeClip.setIsOnTopWhenCompact(isChecked)}
                />
            </div>
            <div className="btn-row">
                <button className="btn" onClick={() => storeClip.enterCompact()}>
                    <CollapseIconHorizontal width={14} height={14} />
                    <span>shrink to clipboard viewer</span>
                </button>
            </div>
            <span className="feature-label">cached entries (newest first)</span>
            <div className="clip-entry-list">
                {storeClip.entries.length === 0 && (
                    <div className="clip-entry-empty">nothing captured yet; copy some text or an image</div>
                )}
                {storeClip.entries.map((entry, index) => (
                    <div
                        key={entry.id}
                        className={'clip-entry-row' + (index === storeClip.indexCurrent ? ' is-current' : '')}
                        onClick={() => storeClip.setIndexCurrent(index)}
                    >
                        <span className="clip-entry-type">{entry.type}</span>
                        {entry.type === 'text' ? (
                            <span className="clip-entry-snippet">{entry.text}</span>
                        ) : (
                            <img className="clip-entry-thumb" src={entry.imageDataUrl} alt="" draggable={false} />
                        )}
                        <span className="clip-entry-time">{formatTimeCopied(entry.timeCopied)}</span>
                        <button
                            className="btn"
                            onClick={(event) => {
                                event.stopPropagation();
                                storeClip.applyEntry(entry.id);
                            }}
                        >
                            apply
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default SubAppClipboardCache;

function formatTimeCopied(timeCopied) {
    return new Date(timeCopied).toLocaleTimeString();
}
