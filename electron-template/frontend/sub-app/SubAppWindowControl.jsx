import { observer } from 'mobx-react-lite';
import { MinusIcon, ExpandIcon, RefreshIcon } from '@wwf971/react-comp-misc';

const SubAppWindowControl = observer(({ store }) => {
    if (!window.windowControl) {
        return <div className="subapp-note">window.windowControl is not available (not running inside Electron).</div>;
    }
    const state = store.subAppStates['window-control'];

    return (
        <div className="subapp-content">
            <div className="btn-row">
                <button className="btn" onClick={() => store.minimize()}>
                    <MinusIcon width={14} height={14} />
                    <span>minimize</span>
                </button>
                <button className="btn" onClick={() => store.toggleMaximize()}>
                    <ExpandIcon width={14} height={14} />
                    <span>{state.isMaximized ? 'unmaximize' : 'maximize'}</span>
                </button>
            </div>
            <div className="feature-row">
                <span className="feature-label">window bounds</span>
                <button className="btn-icon" onClick={() => store.refreshBounds()}>
                    <RefreshIcon width={14} height={14} />
                </button>
            </div>
            <pre className="bounds-view">
                {state.bounds ? JSON.stringify(state.bounds, null, 2) : 'not loaded'}
            </pre>
        </div>
    );
});

export default SubAppWindowControl;
