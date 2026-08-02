import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    SearchIcon,
    EditIcon,
    CrossIcon,
    AddIcon,
    FolderIcon,
    RefreshIcon,
    CheckIcon,
    SegmentedControl,
    EditableValueComp,
    createValueCompOnEvent,
} from '@wwf971/react-comp-misc';
import PathManagerConfigPage from './PathManagerConfigPage.jsx';
import TextWithMatch from '../src/TextWithMatch.jsx';

// Path Manager: named path bookmarks (categories of paths), loaded from a yaml
// data file next to the executable. Absorbed from the old app_electron project.
// Everything rendered here is driven by store.pathManager (PathManagerStore).
const SubAppPathManager = observer(({ store }) => {
    const pm = store.pathManager;

    if (!window.pathManager) {
        return (
            <div className="subapp-note">
                window.pathManager is not available (not running inside Electron).
            </div>
        );
    }

    return (
        <div className="pm-page">
            <SegmentedControl
                data={{
                    valueSelected: pm.pageCurrentId,
                    segList: [
                        { value: 'paths', labelText: 'paths' },
                        { value: 'config', labelText: 'config' },
                    ],
                }}
                onEvent={(nameEvent, payload) => {
                    if (nameEvent === 'valueSelectedChange') pm.setPageCurrentId(payload.valueSelected);
                }}
            />
            {pm.message !== null && (
                <div className={'pm-message' + (pm.message.type === 'error' ? ' is-error' : '')}>
                    {pm.message.text}
                </div>
            )}
            {pm.pageCurrentId === 'paths' ? (
                <PathsView pm={pm} />
            ) : (
                <PathManagerConfigPage pm={pm} />
            )}
        </div>
    );
});

export default SubAppPathManager;

const PathsView = observer(({ pm }) => {
    return (
        <div className="pm-view">
            <div className="pm-title-row">
                <span className="pm-title">paths</span>
                <button className="btn-icon" title="reload config + data file" onClick={() => pm.refresh()}>
                    <RefreshIcon width={14} height={14} />
                </button>
                <span className="pm-file-path">{pm.filePathData}</span>
            </div>
            <div className="search-bar">
                <SearchIcon width={16} height={16} />
                <SearchTextInput pm={pm} />
                {pm.searchText !== '' && (
                    <button className="btn-icon" title="clear search" onClick={() => pm.setSearchText('')}>
                        <CrossIcon width={13} height={13} />
                    </button>
                )}
            </div>
            {pm.categoriesFiltered.map((category) => (
                <CategoryBlock key={category.id} pm={pm} category={category} />
            ))}
            {!pm.isDataLoading && pm.categoriesFiltered.length === 0 && (
                <div className="pm-empty">
                    {pm.searchText.trim() === '' ? 'no category yet' : 'nothing matches the search'}
                </div>
            )}
            <div className="btn-row pm-add-row">
                <button className="btn" onClick={() => pm.categoryAdd(false)}>
                    <AddIcon width={13} height={13} />
                    <span>category (named paths)</span>
                </button>
                <button className="btn" onClick={() => pm.categoryAdd(true)}>
                    <AddIcon width={13} height={13} />
                    <span>category (path list)</span>
                </button>
            </div>
        </div>
    );
});

// search bar input as a contenteditable div (no <input> element).
// the dom text is only pushed from the store when they differ, so the caret is
// not reset while the user is typing (store echoes back the same text).
const SearchTextInput = observer(({ pm }) => {
    const elRef = useRef(null);

    useEffect(() => {
        const el = elRef.current;
        if (el && el.textContent !== pm.searchText) {
            el.textContent = pm.searchText;
        }
    }, [pm.searchText]);

    return (
        <div
            ref={elRef}
            className="pm-search-input"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="search name or path..."
            onInput={(event) => pm.setSearchText(event.currentTarget.textContent)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
            }}
        />
    );
});

const PathManagerEditableValue = ({ data, config = {}, onEvent }) => {
    const { textSearch = '', renderText, ...restConfig } = config;
    return (
        <EditableValueComp
            data={data}
            config={{
                valueType: 'text',
                isNotSet: false,
                isEditIconVisible: false,
                ...restConfig,
                renderText: renderText ?? ((textValue) => (
                    <TextWithMatch text={textValue} textSearch={textSearch} />
                )),
            }}
            onEvent={onEvent}
        />
    );
};

const CategoryBlock = observer(({ pm, category }) => {
    const isEditing = pm.categoryEditingId === category.id;
    // shrink-wrapped around name + edit controls so empty space to the right
    // of the input counts as outside (click → commit)
    const editClusterRef = useRef(null);

    return (
        <div className="pm-category">
            <div className="pm-category-header">
                <div
                    ref={editClusterRef}
                    className={'pm-edit-cluster' + (isEditing ? ' is-editing' : '')}
                >
                    <PathManagerEditableValue
                        data={{ text: category.name }}
                        config={{
                            className: 'pm-editable-value pm-category-name-box',
                            textClassName: 'pm-category-name',
                            commitRootRef: editClusterRef,
                            isEditing,
                            textSearch: pm.searchText,
                            placeholder: 'category name',
                            isFocusOnEdit: true,
                            configKey: 'category-name-' + category.id,
                        }}
                        onEvent={createValueCompOnEvent({
                            onUpdate: (_key, textNew) => pm.categoryRename(category.id, textNew),
                            onEditingChange: (nextIsEditing, meta) => {
                                if (nextIsEditing) {
                                    pm.categoryEditStart(category.id);
                                    return;
                                }
                                if (meta.reason !== 'submit') pm.editCancel();
                            },
                            onCancel: () => pm.editCancel(),
                        })}
                    />
                    {isEditing ? (
                        <button className="btn-icon" title="cancel" onClick={() => pm.editCancel()}>
                            <CrossIcon width={13} height={13} />
                        </button>
                    ) : (
                        <>
                            <button className="btn-icon" title="rename category" onClick={() => pm.categoryEditStart(category.id)}>
                                <EditIcon width={13} height={13} />
                            </button>
                            <button className="btn-icon" title="add path entry" onClick={() => pm.entryAdd(category.id)}>
                                <AddIcon width={13} height={13} />
                            </button>
                            <button className="btn-icon" title="delete category" onClick={() => pm.categoryDelete(category.id)}>
                                <CrossIcon width={13} height={13} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {category.entries.map((entry) => (
                <EntryRow key={entry.id} pm={pm} category={category} entry={entry} />
            ))}
            {category.entries.length === 0 && <div className="pm-empty">no path entry</div>}
        </div>
    );
});

const EntryRow = observer(({ pm, category, entry }) => {
    const isEditing = pm.entryEditingId === entry.id;
    // shrink-wrapped around fields + edit controls so empty space to the right
    // of the input counts as outside (click → commit)
    const editClusterRef = useRef(null);
    const nameRef = useRef(null);
    const pathRef = useRef(null);

    // one commit for the whole row: read both fields from the dom
    const commit = () => {
        return pm.entryUpdate(entry.id, {
            name: category.isListStyle ? undefined : (nameRef.current?.textContent ?? ''),
            path: pathRef.current?.textContent ?? '',
        });
    };

    return (
        <div className={'pm-entry-row' + (isEditing ? ' is-editing' : '')}>
            <div
                ref={editClusterRef}
                className={'pm-edit-cluster' + (isEditing ? ' is-editing' : '')}
            >
                {!category.isListStyle && (
                    <PathManagerEditableValue
                        data={{ text: entry.name ?? '' }}
                        config={{
                            editElementRef: nameRef,
                            commitRootRef: editClusterRef,
                            className: 'pm-editable-value pm-entry-name-box',
                            textClassName: 'pm-entry-name',
                            isEditing,
                            textSearch: pm.searchText,
                            placeholder: 'name',
                            isFocusOnEdit: true,
                            configKey: 'entry-name-' + entry.id,
                        }}
                        onEvent={createValueCompOnEvent({
                            onUpdate: commit,
                            onEditingChange: (nextIsEditing, meta) => {
                                if (nextIsEditing) {
                                    pm.entryEditStart(entry.id);
                                    return;
                                }
                                if (meta.reason !== 'submit') pm.editCancel();
                            },
                            onCancel: () => pm.editCancel(),
                        })}
                    />
                )}
                <PathManagerEditableValue
                    data={{ text: entry.path }}
                    config={{
                        editElementRef: pathRef,
                        commitRootRef: editClusterRef,
                        className: 'pm-editable-value pm-entry-path-box',
                        textClassName: 'pm-entry-path',
                        isEditing,
                        textSearch: pm.searchText,
                        placeholder: 'path',
                        isFocusOnEdit: category.isListStyle,
                        configKey: 'entry-path-' + entry.id,
                    }}
                    onEvent={createValueCompOnEvent({
                        onUpdate: commit,
                        onEditingChange: (nextIsEditing, meta) => {
                            if (nextIsEditing) {
                                pm.entryEditStart(entry.id);
                                return;
                            }
                            if (meta.reason !== 'submit') pm.editCancel();
                        },
                        onCancel: () => pm.editCancel(),
                    })}
                />
                {isEditing ? (
                    <>
                        <button className="btn-icon" title="save" onClick={commit}>
                            <CheckIcon width={14} height={14} />
                        </button>
                        <button className="btn-icon" title="cancel" onClick={() => pm.editCancel()}>
                            <CrossIcon width={13} height={13} />
                        </button>
                    </>
                ) : (
                    <>
                        <button className="btn-icon" title="edit" onClick={() => pm.entryEditStart(entry.id)}>
                            <EditIcon width={13} height={13} />
                        </button>
                        <button className="btn-icon" title="open with default app" onClick={() => pm.pathOpen(entry.path)}>
                            <FolderIcon width={14} height={14} />
                        </button>
                        <button className="btn pm-btn-copy" onClick={() => pm.pathCopy(entry.path)}>copy</button>
                        <button className="btn-icon" title="delete entry" onClick={() => pm.entryDelete(entry.id)}>
                            <CrossIcon width={13} height={13} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});
