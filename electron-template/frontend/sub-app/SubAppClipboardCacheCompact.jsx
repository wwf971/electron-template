import { observer } from 'mobx-react-lite';
import { BackIcon, ForwardIcon, ExpandIcon } from '@wwf971/react-comp-misc';
import { startWindowDrag } from 'electron-utils/frontend';

// Shrunk layout of the Clipboard Cache sub app: a small always-visible player.
// Content display above (drag it to move the window), player controls below.
// "earlier" goes to older entries, "later" to newer ones.
const SubAppClipboardCacheCompact = observer(({ store }) => {
    const storeClip = store.clipboardCache;
    const entry = storeClip.entryCurrent;

    return (
        <div className="compact-window clip-compact-window">
            <div
                className="clip-compact-display"
                onMouseDown={(event) => startWindowDrag(event)}
            >
                {entry === null && <span className="clip-compact-empty">clipboard cache is empty</span>}
                {entry !== null && entry.type === 'text' && (
                    <div className="clip-compact-text">{entry.text}</div>
                )}
                {entry !== null && entry.type === 'image' && (
                    <img className="clip-compact-image" src={entry.imageDataUrl} alt="" draggable={false} />
                )}
            </div>
            <div className="clip-compact-controls">
                <button
                    className="btn"
                    disabled={storeClip.indexCurrent >= storeClip.entries.length - 1}
                    onClick={() => storeClip.goEarlier()}
                >
                    <BackIcon width={12} height={12} />
                </button>
                <span className="clip-compact-index">
                    {storeClip.entries.length === 0
                        ? '0/0'
                        : `${storeClip.indexCurrent + 1}/${storeClip.entries.length}`}
                </span>
                <button
                    className="btn"
                    disabled={storeClip.indexCurrent <= 0}
                    onClick={() => storeClip.goLater()}
                >
                    <ForwardIcon width={12} height={12} />
                </button>
                <button
                    className="btn"
                    disabled={storeClip.indexCurrent <= 0}
                    onClick={() => storeClip.goLatest()}
                >
                    latest
                </button>
                <button
                    className="btn"
                    disabled={entry === null}
                    onClick={() => storeClip.applyEntry(entry.id)}
                >
                    apply
                </button>
                <button
                    className="btn"
                    onMouseDown={(event) =>
                        startWindowDrag(event, { onClickWithoutDrag: () => storeClip.exitCompact() })
                    }
                >
                    <ExpandIcon width={12} height={12} />
                </button>
            </div>
        </div>
    );
});

export default SubAppClipboardCacheCompact;
