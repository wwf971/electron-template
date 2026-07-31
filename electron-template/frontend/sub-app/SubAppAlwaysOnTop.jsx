import { observer } from 'mobx-react-lite';
import { PinIcon, BoolSlider } from '@wwf971/react-comp-misc';

const SubAppAlwaysOnTop = observer(({ store }) => {
    if (!window.windowControl) {
        return <div className="subapp-note">window.windowControl is not available (not running inside Electron).</div>;
    }
    const state = store.subAppStates['always-on-top'];

    return (
        <div className="subapp-content">
            <div className="feature-row">
                <PinIcon width={16} height={16} isEnabled={state.isOnTop} />
                <span className="feature-label">always on top: {state.isOnTop ? 'on' : 'off'}</span>
                <BoolSlider
                    checked={state.isOnTop}
                    onChange={(isChecked) => store.setAlwaysOnTop(isChecked)}
                />
            </div>
            <p className="subapp-desc">
                While on, this window stays above all other windows, even when it loses focus.
                Switch to another application to verify.
            </p>
        </div>
    );
});

export default SubAppAlwaysOnTop;
