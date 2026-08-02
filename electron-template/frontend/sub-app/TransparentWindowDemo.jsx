import { CrossIcon } from '@wwf971/react-comp-misc';
import { startWindowResize } from 'electron-utils/frontend';

// Content of the transparent demo window (transparent-window sub app).
// This is a separate window that loads the frontend build with hash
// '#transparent-window-demo' (see src/main.jsx). It shows what a transparent
// frameless window must re-implement by itself:
// - moving: the header is a css drag region (-webkit-app-region: drag)
// - resizing: thin hit areas along edges/corners call startWindowResize of
//   electron-utils (native resize borders are lost on windows)
// - the page background stays transparent (body class 'transparent-window-body')

const resizeDirectionList = [
    'top', 'right', 'bottom', 'left',
    'top-left', 'top-right', 'bottom-left', 'bottom-right',
];

const TransparentWindowDemo = () => {
    return (
        <div className="tw-window">
            {resizeDirectionList.map((direction) => (
                <div
                    key={direction}
                    className={'tw-resize tw-resize-' + direction}
                    onMouseDown={(event) => startWindowResize(event, direction, { minWidth: 200, minHeight: 120 })}
                />
            ))}
            <div className="tw-header">
                <div className="tw-header-drag">
                    <span className="tw-title">transparent window (drag here to move)</span>
                </div>
                <button className="tw-close" title="close" onClick={() => window.windowControl.close()}>
                    <CrossIcon width={13} height={13} />
                </button>
            </div>
            <div className="tw-body">
                <span className="tw-text">this text floats over whatever is behind the window</span>
            </div>
        </div>
    );
};

export default TransparentWindowDemo;
