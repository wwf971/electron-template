import { makeAutoObservable, runInAction } from 'mobx';

// config file of this sub app, searched around the executable via simple-config:
// 1. same folder as the executable, 2. its parent folder, 3. its grandparent folder.
// The list below is in stack order (configStack: later overrides earlier), which
// encodes the app-specific priority: grandparent folder > parent folder > exe folder.
export const fileNameConfig = 'config-path-manager.jsonc';
export const dirConfigScanList = ['${dirExe}', '${dirExe}/..', '${dirExe}/../..'];
export const labelConfigScanList = ['exe folder', 'parent folder', 'grandparent folder'];

// default folder of the data file (path bookmarks), overridable by the
// config entry "dirData". The executable is deployed into a subfolder
// (e.g. <dest>/single/), so ${dirExe}/../data is shared by all build modes.
export const dirDataDefault = '${dirExe}/../data';

// Source of truth of the Path Manager sub app: the path bookmarks (semantic
// data) plus every ui state (current page, search text, which row is being
// edited, config scan results, ...).
//
// data file shape (yaml): { [category name]: [path, ...] | { [entry name]: path } }
// in-store shape: categories = [{ id, name, isListStyle, entries: [{ id, name, path }] }]
// (entries of a list-style category have name = null)
export class PathManagerStore {
    isInited = false;
    pageCurrentId = 'paths'; // 'paths' | 'config'
    searchText = '';
    message = null; // { type: 'info' | 'error', text }
    messageTimer = null;

    // ---- path bookmarks data ----
    // the data file is two-layer (data-path-manager.0.yaml preferred over
    // data-path-manager.yaml); the backend picks one file for all CRUD and
    // reports the parse status of both layers
    isDataLoading = false;
    filePathData = ''; // the file picked for CRUD
    layerUsed = ''; // '0' | 'base'
    dataFiles = []; // parse status of both layers: { layer, filePath, isExist, code, message }
    dirDataResolved = ''; // dirData with ${dirExe} resolved to an absolute path
    filePathBackup = ''; // backup file created by the last load
    categories = [];
    idNext = 1;

    // ---- edit state ----
    categoryEditingId = null;
    entryEditingId = null;
    isDirDataEditing = false;

    // ---- config ----
    dirExe = '';
    configFiles = []; // scan results, same order as dirConfigScanList
    configStacked = {};
    filePathConfigTarget = ''; // the config file that entry CRUD writes to

    constructor() {
        makeAutoObservable(this);
    }

    get dirData() {
        return this.configStacked.dirData ?? dirDataDefault;
    }

    // categories filtered by searchText: a match on the category name keeps the
    // whole category, otherwise only the matched entries are kept
    get categoriesFiltered() {
        const text = this.searchText.trim().toLowerCase();
        if (text === '') return this.categories;
        const result = [];
        for (const category of this.categories) {
            if (category.name.toLowerCase().includes(text)) {
                result.push(category);
                continue;
            }
            const entries = category.entries.filter(
                (entry) =>
                    (entry.name ?? '').toLowerCase().includes(text) ||
                    entry.path.toLowerCase().includes(text)
            );
            if (entries.length > 0) {
                result.push({ ...category, entries });
            }
        }
        return result;
    }

    async init() {
        if (this.isInited || !window.pathManager) return;
        this.isInited = true;
        await this.refresh();
    }

    async refresh() {
        await this.configRefresh();
        await this.dataLoad();
    }

    setPageCurrentId(pageId) {
        this.pageCurrentId = pageId;
    }

    setSearchText(text) {
        this.searchText = text;
    }

    messageShow(type, text) {
        this.message = { type, text };
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(
            () => runInAction(() => { this.message = null; }),
            4000
        );
    }

    // ---- config ----

    async configRefresh() {
        const resScan = await window.simpleConfig.scan({
            dirList: dirConfigScanList,
            fileName: fileNameConfig,
        });
        if (resScan.code !== 0) {
            this.messageShow('error', resScan.message);
            return;
        }
        const files = resScan.data.files;
        // stack in list order, so the grandparent folder ends up with top priority
        const configList = files
            .filter((file) => file.isExist && file.code === 0)
            .map((file) => file.config);
        const resStack = await window.simpleConfig.stack({ configList });
        runInAction(() => {
            this.dirExe = resScan.data.dirExe;
            this.configFiles = files;
            this.configStacked = resStack.code === 0 ? resStack.data : {};
            if (this.filePathConfigTarget === '') {
                // default write target: the first existing config file,
                // otherwise the parent folder of the executable
                const fileExisting = files.find((file) => file.isExist);
                this.filePathConfigTarget = fileExisting ? fileExisting.filePath : files[1].filePath;
            }
        });
    }

    setConfigTarget(filePath) {
        this.filePathConfigTarget = filePath;
    }

    setDirDataEditing(isEditing) {
        this.isDirDataEditing = isEditing;
    }

    async configEntrySet(keyPath, value) {
        const res = await window.simpleConfig.entrySet({
            filePath: this.filePathConfigTarget,
            keyPath,
            value,
        });
        if (res.code !== 0) {
            this.messageShow('error', res.message);
            return res;
        }
        this.messageShow('info', 'config entry written to ' + res.data.filePath);
        await this.refresh(); // dirData may have changed, reload the data file too
        return res;
    }

    async configEntryDelete(keyPath) {
        const res = await window.simpleConfig.entryDelete({
            filePath: this.filePathConfigTarget,
            keyPath,
        });
        if (res.code !== 0) {
            this.messageShow('error', res.message);
            return;
        }
        await this.refresh();
    }

    // ---- data file load / save ----

    async dataLoad() {
        this.isDataLoading = true;
        const res = await window.pathManager.dataRead({ dirData: this.dirData });
        runInAction(() => {
            this.isDataLoading = false;
            if (res.code !== 0) {
                this.messageShow('error', res.message);
                return;
            }
            this.dirDataResolved = res.data.dirDataResolved;
            this.dataFiles = res.data.files;
            this.filePathData = res.data.filePathUsed;
            this.layerUsed = res.data.layerUsed;
            this.filePathBackup = res.data.filePathBackup;
            this.categories = this.categoriesFromData(res.data.dataPaths);
            if (res.data.isCreated) {
                this.messageShow('info', 'created data file with template content: ' + res.data.filePathUsed);
            }
        });
    }

    async dataSave() {
        const res = await window.pathManager.dataWrite({
            dirData: this.dirData,
            dataPaths: this.dataPathsFromCategories(),
        });
        if (res.code !== 0) {
            this.messageShow('error', res.message);
            return res;
        }
        runInAction(() => {
            this.filePathData = res.data.filePath;
        });
        return res;
    }

    categoriesFromData(dataPaths) {
        const categories = [];
        for (const [nameCategory, value] of Object.entries(dataPaths ?? {})) {
            const category = {
                id: this.idNext++,
                name: nameCategory,
                isListStyle: Array.isArray(value),
                entries: [],
            };
            if (Array.isArray(value)) {
                for (const pathItem of value) {
                    category.entries.push({ id: this.idNext++, name: null, path: String(pathItem) });
                }
            } else if (typeof value === 'object' && value !== null) {
                for (const [nameEntry, pathItem] of Object.entries(value)) {
                    category.entries.push({ id: this.idNext++, name: nameEntry, path: String(pathItem) });
                }
            } else {
                category.entries.push({ id: this.idNext++, name: null, path: String(value) });
            }
            categories.push(category);
        }
        return categories;
    }

    dataPathsFromCategories() {
        const dataPaths = {};
        for (const category of this.categories) {
            if (category.isListStyle) {
                dataPaths[category.name] = category.entries.map((entry) => entry.path);
            } else {
                const entriesMap = {};
                for (const entry of category.entries) {
                    entriesMap[entry.name ?? ''] = entry.path;
                }
                dataPaths[category.name] = entriesMap;
            }
        }
        return dataPaths;
    }

    // ---- category / entry operations (every commit saves the data file) ----

    categoryAdd(isListStyle) {
        const category = { id: this.idNext++, name: '', isListStyle, entries: [] };
        this.categories.push(category);
        this.categoryEditingId = category.id; // saved when the rename is committed
    }

    async categoryRename(categoryId, nameNew) {
        if (this.categoryEditingId !== categoryId) return { code: 0, message: 'not editing' };
        const category = this.categories.find((item) => item.id === categoryId);
        if (!category) return { code: -1, message: 'category not found' };
        const trimmed = nameNew.trim();
        // unchanged: exit without writing; also drops a just-added empty category
        if (trimmed === category.name) {
            this.editCancel();
            return { code: 0, message: 'unchanged' };
        }
        const nameOld = category.name;
        category.name = trimmed;
        this.categoryEditingId = null;
        const res = await this.dataSave();
        if (res.code !== 0) {
            category.name = nameOld;
        }
        return res;
    }

    async categoryDelete(categoryId) {
        this.categories = this.categories.filter((item) => item.id !== categoryId);
        await this.dataSave();
    }

    entryAdd(categoryId) {
        const category = this.categories.find((item) => item.id === categoryId);
        if (!category) return;
        const entry = {
            id: this.idNext++,
            name: category.isListStyle ? null : '',
            path: '',
        };
        category.entries.push(entry);
        this.entryEditingId = entry.id; // saved when the edit is committed
    }

    async entryUpdate(entryId, { name, path }) {
        if (this.entryEditingId !== entryId) return { code: 0, message: 'not editing' };
        const entry = this.entryFind(entryId);
        if (!entry) return { code: -1, message: 'entry not found' };
        const nameNext = name !== undefined ? name : entry.name;
        const pathNext = path;
        // unchanged: exit without writing; also drops a just-added empty entry
        if (nameNext === entry.name && pathNext === entry.path) {
            this.editCancel();
            return { code: 0, message: 'unchanged' };
        }
        const nameOld = entry.name;
        const pathOld = entry.path;
        if (name !== undefined) entry.name = name;
        entry.path = path;
        this.entryEditingId = null;
        const res = await this.dataSave();
        if (res.code !== 0) {
            entry.name = nameOld;
            entry.path = pathOld;
        }
        return res;
    }

    async entryDelete(entryId) {
        for (const category of this.categories) {
            category.entries = category.entries.filter((item) => item.id !== entryId);
        }
        await this.dataSave();
    }

    entryFind(entryId) {
        for (const category of this.categories) {
            const entry = category.entries.find((item) => item.id === entryId);
            if (entry) return entry;
        }
        return null;
    }

    categoryEditStart(categoryId) {
        this.categoryEditingId = categoryId;
    }

    entryEditStart(entryId) {
        this.entryEditingId = entryId;
    }

    // cancel any ongoing edit; a just-added row that is still empty is removed
    editCancel() {
        if (this.entryEditingId !== null) {
            const entry = this.entryFind(this.entryEditingId);
            if (entry && entry.path === '' && (entry.name ?? '') === '') {
                for (const category of this.categories) {
                    category.entries = category.entries.filter((item) => item.id !== entry.id);
                }
            }
        }
        if (this.categoryEditingId !== null) {
            const category = this.categories.find((item) => item.id === this.categoryEditingId);
            if (category && category.name === '' && category.entries.length === 0) {
                this.categories = this.categories.filter((item) => item.id !== category.id);
            }
        }
        this.entryEditingId = null;
        this.categoryEditingId = null;
        this.isDirDataEditing = false;
    }

    // ---- path actions ----

    async pathOpen(pathTarget) {
        const res = await window.pathManager.pathOpen({ pathTarget });
        if (res.code !== 0) {
            this.messageShow('error', res.message);
        }
    }

    async pathCopy(pathTarget) {
        await navigator.clipboard.writeText(pathTarget);
        this.messageShow('info', 'copied: ' + pathTarget);
    }
}
