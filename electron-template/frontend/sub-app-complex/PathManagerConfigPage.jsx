import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    ConfigPanel,
    EditIcon,
    CrossIcon,
    RefreshIcon,
    FolderIcon,
    InfoIconWithTooltip,
    EditableValueComp,
    createValueCompOnEvent,
} from '@wwf971/react-comp-misc';
import { labelConfigScanList, dirDataDefault } from './PathManagerStore.js';

// Config page of the Path Manager sub app, rendered with the config-panel
// components of react-comp-misc (ConfigPanel + custom value controls).
// It shows:
// - the effective (stacked) config; the dirData entry is editable, written to
//   the selected target file via the simple-config api of electron-utils
// - the parse result of the two-layer data file (which layer is used for CRUD)
// - the config files found around the executable
const PathManagerConfigPage = observer(({ pm }) => {
    const fileNameOf = (filePath) => filePath.split(/[\\/]/).pop();

    // rebuilt every render: the data-file rows come from the last load
    const configPanelConfig = {
        compPath: ['path-manager-config'],
        items: [
            {
                id: 'group_config',
                label: 'effective config',
                type: 'group',
                children: [
                    {
                        id: 'dirData',
                        label: 'dirData',
                        description: 'folder holding the data file. ${dirExe} = folder of the executable. default: ' + dirDataDefault,
                        comp: ConfigValueDirData,
                        compProps: { pm },
                    },
                    {
                        id: 'dirDataResolved',
                        label: 'data folder',
                        description: 'dirData resolved to an absolute path',
                        comp: ConfigValueDirOpen,
                        compProps: { pm },
                    },
                    {
                        id: 'dirExe',
                        label: 'dirExe',
                        description: 'folder of the executable (a pseudo folder in dev mode)',
                        comp: ConfigValueDirOpen,
                        compProps: { pm },
                    },
                ],
            },
            {
                id: 'group_data_file',
                label: 'data file',
                type: 'group',
                children: [
                    ...pm.dataFiles.map((file) => ({
                        id: 'data-file-' + file.layer,
                        label: fileNameOf(file.filePath),
                        description: file.filePath,
                        comp: ConfigValueDataFile,
                        compProps: { pm, file },
                    })),
                    {
                        id: 'data-file-backup',
                        label: 'backup on load',
                        description: 'each load copies the used file to <full name>.<time stamp>.bak',
                        comp: ConfigValuePathOpen,
                        compProps: { pm, textOf: () => pm.filePathBackup },
                    },
                ],
            },
        ],
    };

    const configPanelData = {
        dirData: String(pm.dirData),
        dirDataResolved: pm.dirDataResolved,
        dirExe: pm.dirExe,
    };

    const onConfigPanelEvent = (eventType, eventData) => {
        if (eventType === 'valueChangeAttempt' && eventData.valueId === 'dirData') {
            return pm.configEntrySet('dirData', eventData.value);
        }
        return { code: 0 };
    };

    return (
        <div className="pm-view">
            <div className="pm-title-row">
                <span className="pm-title">config</span>
                <button className="btn-icon" title="rescan config files + reload the data file" onClick={() => pm.refresh()}>
                    <RefreshIcon width={14} height={14} />
                </button>
                <InfoIconWithTooltip tooltipText="config files found below are stacked into this effective config. priority: grandparent folder > parent folder > exe folder." />
            </div>
            <ConfigPanel
                data={configPanelData}
                config={configPanelConfig}
                onEvent={onConfigPanelEvent}
            />

            <div className="pm-title-row pm-section-gap">
                <span className="pm-title">config files</span>
                <InfoIconWithTooltip tooltipText="the config file is searched in: the folder of the executable, its parent folder, and its grandparent folder. pick one file as the write target for edits made on this page." />
            </div>
            {pm.configFiles.map((file, index) => (
                <ConfigFileBlock key={file.filePath} pm={pm} file={file} label={labelConfigScanList[index]} />
            ))}
        </div>
    );
});

export default PathManagerConfigPage;

// horizontal path scroll: offset is owned by a small mobx object (same idea as
// ConfigHorizontalViewport). the folder / action buttons stay outside this
// viewport so they are never scrolled away.
function createPathScrollState() {
    return makeAutoObservable({
        offsetX: 0,
        offsetMax: 0,
        updateSize(widthViewport, widthContent) {
            this.offsetMax = Math.max(0, widthContent - widthViewport);
            this.offsetX = Math.min(this.offsetX, this.offsetMax);
        },
        scroll(deltaX) {
            if (this.offsetMax <= 0) return;
            this.offsetX = Math.max(0, Math.min(this.offsetMax, this.offsetX + deltaX));
        },
    });
}

const PathScrollText = observer(({ text, className = '' }) => {
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const [scrollState] = useState(() => createPathScrollState());

    useLayoutEffect(() => {
        const viewportEl = viewportRef.current;
        const trackEl = trackRef.current;
        if (!viewportEl || !trackEl) return undefined;
        const updateSize = () => {
            scrollState.updateSize(viewportEl.clientWidth, trackEl.scrollWidth);
        };
        const observer = new ResizeObserver(updateSize);
        observer.observe(viewportEl);
        observer.observe(trackEl);
        updateSize();
        return () => observer.disconnect();
    }, [scrollState, text]);

    useEffect(() => {
        const viewportEl = viewportRef.current;
        if (!viewportEl) return undefined;
        const onWheel = (event) => {
            if (scrollState.offsetMax <= 0) return;
            event.preventDefault();
            scrollState.scroll(event.deltaX + event.deltaY);
        };
        viewportEl.addEventListener('wheel', onWheel, { passive: false });
        return () => viewportEl.removeEventListener('wheel', onWheel);
    }, [scrollState]);

    return (
        <div
            ref={viewportRef}
            className={'pm-cfg-path-viewport' + (className ? ' ' + className : '')}
            title={text}
        >
            <div
                ref={trackRef}
                className="pm-cfg-path-track"
                style={{ transform: 'translateX(' + (-scrollState.offsetX) + 'px)' }}
            >
                {text}
            </div>
        </div>
    );
});

// button-next-to-text row for a path: path scrolls when long; trailing buttons
// (folder open, ...) stay visible. width is locked to the ConfigPanel control
// clip parent so the panel's own right-aligned viewport does not scroll the
// folder icon away with the path.
function useClipParentWidth(ref) {
    const [width, setWidth] = useState(null);

    useLayoutEffect(() => {
        const startEl = ref.current;
        if (!startEl) return undefined;
        let clipParent = null;
        let node = startEl.parentElement;
        while (node) {
            const overflowX = getComputedStyle(node).overflowX;
            if (overflowX === 'hidden' || overflowX === 'clip') {
                clipParent = node;
                break;
            }
            node = node.parentElement;
        }
        if (!clipParent) return undefined;
        const update = () => setWidth(clipParent.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(clipParent);
        return () => observer.disconnect();
    }, [ref]);

    return width;
}

const PathValueCell = observer(({ pathText, onPathOpen, openTitle = 'open this path', buttonsBeforeOpen = null, pathContent = null }) => {
    const cellRef = useRef(null);
    const widthCell = useClipParentWidth(cellRef);

    return (
        <div
            ref={cellRef}
            className="pm-cfg-value-cell"
            style={widthCell != null ? { width: widthCell } : undefined}
        >
            {pathContent ?? <PathScrollText text={pathText} />}
            {buttonsBeforeOpen}
            {onPathOpen && (
                <button className="btn-icon" title={openTitle} onClick={onPathOpen}>
                    <FolderIcon width={14} height={14} />
                </button>
            )}
        </div>
    );
});

// value cell of the dirData entry: scrollable path when idle; contenteditable
// while editing; edit / reset / open-folder buttons stay outside the path scroll
const ConfigValueDirData = observer(({ pm, value, onValueChange }) => {
    const pathText = String(value);
    const buttonsBeforeOpen = !pm.isDirDataEditing ? (
        <>
            <button className="btn-icon" title="edit (written to the target config file)" onClick={() => pm.setDirDataEditing(true)}>
                <EditIcon width={13} height={13} />
            </button>
            {pm.configStacked.dirData !== undefined && (
                <button className="btn-icon" title="delete the entry from the target config file (back to default)" onClick={() => pm.configEntryDelete('dirData')}>
                    <CrossIcon width={13} height={13} />
                </button>
            )}
        </>
    ) : null;

    const pathContent = pm.isDirDataEditing ? (
        <EditableValueComp
            data={{ value: pathText }}
            config={{
                className: 'pm-editable-value pm-config-value-box',
                textClassName: 'pm-config-value',
                valueType: 'text',
                isNotSet: false,
                isEditing: true,
                isFocusOnEdit: true,
                isEditIconVisible: false,
                configKey: 'dirData',
            }}
            onEvent={createValueCompOnEvent({
                onUpdate: (_key, textNew) => {
                    const trimmed = textNew.trim();
                    if (trimmed === pathText) return { code: 0, message: 'unchanged' };
                    return onValueChange(trimmed);
                },
                onEditingChange: (nextIsEditing) => pm.setDirDataEditing(nextIsEditing),
                onCancel: () => pm.setDirDataEditing(false),
            })}
        />
    ) : (
        <PathScrollText text={pathText} />
    );

    return (
        <PathValueCell
            pathText={pathText}
            onPathOpen={pm.isDirDataEditing ? null : () => pm.pathOpen(pm.dirDataResolved)}
            openTitle={'open folder: ' + pm.dirDataResolved}
            buttonsBeforeOpen={buttonsBeforeOpen}
            pathContent={pathContent}
        />
    );
});

// value cell of a read-only dir path: scrollable text + folder button always visible
const ConfigValueDirOpen = observer(({ pm, value }) => {
    const pathText = String(value);
    return (
        <PathValueCell
            pathText={pathText}
            onPathOpen={() => pm.pathOpen(pathText)}
            openTitle="open this folder"
        />
    );
});

// value cell of one data-file layer: parse status + folder button for the path
const ConfigValueDataFile = observer(({ pm, file }) => {
    const cellRef = useRef(null);
    const widthCell = useClipParentWidth(cellRef);
    const isUsed = file.filePath === pm.filePathData;
    const statusText = !file.isExist
        ? 'not found'
        : file.code !== 0
            ? file.message
            : 'valid';
    return (
        <div
            ref={cellRef}
            className="pm-cfg-value-cell"
            style={widthCell != null ? { width: widthCell } : undefined}
        >
            {isUsed && <span className="pm-cfg-tag-used">in use</span>}
            <span
                className={'pm-cfg-value-text' + (file.isExist && file.code !== 0 ? ' pm-error' : '')}
                title={statusText}
            >
                {statusText}
            </span>
            <button className="btn-icon" title="open this path" onClick={() => pm.pathOpen(file.filePath)}>
                <FolderIcon width={14} height={14} />
            </button>
        </div>
    );
});

// value cell showing one path (textOf keeps the mobx read inside this observer)
const ConfigValuePathOpen = observer(({ pm, textOf }) => {
    const text = textOf();
    if (!text) {
        return (
            <div className="pm-cfg-value-cell">
                <span className="pm-cfg-value-text">(none yet)</span>
            </div>
        );
    }
    return (
        <PathValueCell
            pathText={text}
            onPathOpen={() => pm.pathOpen(text)}
            openTitle="open this path"
        />
    );
});

const ConfigFileBlock = observer(({ pm, file, label }) => {
    const isTarget = pm.filePathConfigTarget === file.filePath;

    return (
        <div className="pm-config-file">
            <div className="pm-config-file-header">
                <span className="pm-config-file-label">{label}</span>
                <span className="pm-config-file-state">
                    {!file.isExist ? 'no config file' : file.code === 0 ? 'loaded' : 'parse error'}
                </span>
                <button
                    className={'btn pm-btn-target' + (isTarget ? ' is-active' : '')}
                    onClick={() => pm.setConfigTarget(file.filePath)}
                >
                    {isTarget ? 'write target' : 'set as write target'}
                </button>
            </div>
            <div className="pm-config-file-path-row">
                <PathScrollText text={file.filePath} />
                <button className="btn-icon" title="open this path" onClick={() => pm.pathOpen(file.filePath)}>
                    <FolderIcon width={14} height={14} />
                </button>
            </div>
            {file.isExist && file.code === 0 && (
                <pre className="pm-config-file-raw">{file.textRaw}</pre>
            )}
            {file.isExist && file.code !== 0 && (
                <div className="pm-error">{file.message}</div>
            )}
        </div>
    );
});
