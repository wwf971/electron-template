import { observer } from 'mobx-react-lite';

// Transparent-window demo (gallery side): open/close a transparent frameless
// window, provided by the transparent-window feature of electron-utils.
// The content of the demo window itself is ./TransparentWindowDemo.jsx.
const SubAppTransparentWindow = observer(({ store }) => {
    const state = store.subAppStates['transparent-window'];

    if (!window.transparentWindow) {
        return (
            <div className="subapp-note">
                window.transparentWindow is not available (not running inside Electron).
            </div>
        );
    }

    return (
        <div className="subapp-content">
            <p className="subapp-desc">
                opens a frameless window with a transparent background. such a window
                loses the native title bar and resize borders, so the demo window
                re-implements them: drag its header to move, drag its edges to resize.
            </p>
            <div className="feature-row">
                <span className="feature-label">demo window:</span>
                <span>{state.isOpen ? 'open' : 'closed'}</span>
            </div>
            <div className="btn-row">
                <button className="btn" onClick={() => store.transparentWindowOpen()} disabled={state.isOpen}>
                    open transparent window
                </button>
                <button className="btn" onClick={() => store.transparentWindowClose()} disabled={!state.isOpen}>
                    close
                </button>
            </div>
        </div>
    );
});

export default SubAppTransparentWindow;
