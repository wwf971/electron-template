import { observer } from 'mobx-react-lite';
import { MinusIcon, ExpandIcon, CrossIcon } from '@wwf971/react-comp-misc';

// Custom title bar for the frameless window: app name on the left (drag region),
// window buttons on the right. Not rendered while in compact mode.
const TitleBar = observer(({ store }) => {
    return (
        <div className="title-bar">
            <span className="title-bar-name">ElectronUtils</span>
            <div className="title-bar-buttons">
                <button className="title-bar-btn" onClick={() => store.minimize()}>
                    <MinusIcon width={12} height={12} />
                </button>
                <button className="title-bar-btn" onClick={() => store.toggleMaximize()}>
                    <ExpandIcon width={12} height={12} />
                </button>
                <button className="title-bar-btn" onClick={() => store.closeWindow()}>
                    <CrossIcon size={12} />
                </button>
            </div>
        </div>
    );
});

export default TitleBar;
