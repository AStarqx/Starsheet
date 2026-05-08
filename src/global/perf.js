import Store from '../store';

function ensurePerformanceState() {
    if (Store.performanceState == null || typeof Store.performanceState !== 'object') {
        Store.performanceState = {};
    }

    if (Store.performanceState.sheetVersions == null) {
        Store.performanceState.sheetVersions = {};
    }

    if (Store.performanceState.caches == null) {
        Store.performanceState.caches = {
            conditionFormat: {},
            alternateFormat: {},
            overflow: {},
        };
    }

    return Store.performanceState;
}

function getSheetKey(sheetIndex = Store.currentSheetIndex) {
    return sheetIndex == null ? 'default' : sheetIndex.toString();
}

function ensureSheetVersionState(sheetIndex = Store.currentSheetIndex) {
    let performanceState = ensurePerformanceState();
    let sheetKey = getSheetKey(sheetIndex);

    if (performanceState.sheetVersions[sheetKey] == null) {
        performanceState.sheetVersions[sheetKey] = {
            dataVersion: 0,
            formatVersion: 0,
            layoutVersion: 0,
        };
    }

    return performanceState.sheetVersions[sheetKey];
}

function clearSheetCaches(sheetIndex = Store.currentSheetIndex, cacheNames = []) {
    let performanceState = ensurePerformanceState();
    let sheetKey = getSheetKey(sheetIndex);

    cacheNames.forEach((cacheName) => {
        if (performanceState.caches[cacheName] != null) {
            delete performanceState.caches[cacheName][sheetKey];
        }
    });
}

function getSheetCache(cacheName, sheetIndex = Store.currentSheetIndex) {
    let performanceState = ensurePerformanceState();
    let sheetKey = getSheetKey(sheetIndex);

    if (performanceState.caches[cacheName] == null) {
        performanceState.caches[cacheName] = {};
    }

    if (performanceState.caches[cacheName][sheetKey] == null) {
        performanceState.caches[cacheName][sheetKey] = {};
    }

    return performanceState.caches[cacheName][sheetKey];
}

function bumpSheetDataVersion(sheetIndex = Store.currentSheetIndex) {
    let versionState = ensureSheetVersionState(sheetIndex);
    versionState.dataVersion += 1;
    clearSheetCaches(sheetIndex, ['conditionFormat', 'overflow']);
    return versionState;
}

function bumpSheetFormatVersion(sheetIndex = Store.currentSheetIndex) {
    let versionState = ensureSheetVersionState(sheetIndex);
    versionState.formatVersion += 1;
    clearSheetCaches(sheetIndex, ['conditionFormat', 'alternateFormat', 'overflow']);
    return versionState;
}

function bumpSheetLayoutVersion(sheetIndex = Store.currentSheetIndex) {
    let versionState = ensureSheetVersionState(sheetIndex);
    versionState.layoutVersion += 1;
    clearSheetCaches(sheetIndex, ['alternateFormat', 'overflow']);
    return versionState;
}

export {
    ensurePerformanceState,
    ensureSheetVersionState,
    getSheetCache,
    bumpSheetDataVersion,
    bumpSheetFormatVersion,
    bumpSheetLayoutVersion,
};