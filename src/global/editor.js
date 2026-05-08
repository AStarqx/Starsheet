import browser from './browser';
import formula from './formula';
import { datagridgrowth } from './getdata';
import { jfrefreshgrid, jfrefreshgridall, jfrefreshrange } from './refresh';
import { getSheetIndex } from '../methods/get';
import Store from '../store';

const editor = {
    //worker+blob实现深拷贝替换extend
    deepCopyFlowDataState:false,
    deepCopyFlowDataCache:"",
    deepCopyFlowDataWorker:null,
    deepCopyFlowDataWorkerReady:false,
    cloneCellValue:function(cell){
        if(cell == null || typeof cell !== 'object'){
            return cell;
        }

        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(cell);
            }
            catch (error) {}
        }

        return $.extend(true, {}, cell);
    },
    cloneFlowDataSnapshot:function(flowData){
        if (!Array.isArray(flowData)) {
            return [];
        }

        let snapshot = new Array(flowData.length);

        for (let r = 0; r < flowData.length; r++) {
            let row = flowData[r];

            if (!Array.isArray(row)) {
                snapshot[r] = row;
                continue;
            }

            let rowSnapshot = new Array(row.length);
            for (let c = 0; c < row.length; c++) {
                rowSnapshot[c] = this.cloneCellValue(row[c]);
            }

            snapshot[r] = rowSnapshot;
        }

        return snapshot;
    },
    normalizeRanges:function(ranges){
        if (ranges == null) {
            return [];
        }

        if (Array.isArray(ranges)) {
            return ranges;
        }

        return [ranges];
    },
    applyFlowDataPatchToCache:function(flowData, ranges){
        if (!Array.isArray(this.deepCopyFlowDataCache)) {
            this.deepCopyFlowDataCache = this.cloneFlowDataSnapshot(flowData);
            this.deepCopyFlowDataState = true;
            return;
        }

        let normalizedRanges = this.normalizeRanges(ranges);

        if (normalizedRanges.length === 0) {
            this.deepCopyFlowDataCache = this.cloneFlowDataSnapshot(flowData);
            this.deepCopyFlowDataState = true;
            return;
        }

        for (let i = 0; i < normalizedRanges.length; i++) {
            let range = normalizedRanges[i];

            if (range == null || !Array.isArray(range.row) || !Array.isArray(range.column)) {
                this.deepCopyFlowDataCache = this.cloneFlowDataSnapshot(flowData);
                this.deepCopyFlowDataState = true;
                return;
            }

            for (let r = range.row[0]; r <= range.row[1]; r++) {
                let sourceRow = flowData[r];

                if (!Array.isArray(sourceRow)) {
                    this.deepCopyFlowDataCache[r] = sourceRow;
                    continue;
                }

                if (!Array.isArray(this.deepCopyFlowDataCache[r]) || this.deepCopyFlowDataCache[r].length !== sourceRow.length) {
                    this.deepCopyFlowDataCache[r] = new Array(sourceRow.length);
                }

                for (let c = range.column[0]; c <= range.column[1]; c++) {
                    this.deepCopyFlowDataCache[r][c] = this.cloneCellValue(sourceRow[c]);
                }
            }
        }

        this.deepCopyFlowDataState = true;
    },
    ensureFlowDataWorker:function(){
        let _this = this;

        if (_this.deepCopyFlowDataWorker != null) {
            return _this.deepCopyFlowDataWorker;
        }

        try {
            let workerSource = `
                let cache = [];

                function ensureRow(rowIndex, length) {
                    if (!Array.isArray(cache[rowIndex]) || cache[rowIndex].length !== length) {
                        cache[rowIndex] = new Array(length);
                    }
                }

                self.onmessage = function(event) {
                    const message = event.data || {};

                    if (message.type === 'full') {
                        cache = message.flowData || [];
                        self.postMessage({ type: 'ready' });
                        return;
                    }

                    if (message.type === 'patch') {
                        const flowData = message.flowData || [];
                        const ranges = Array.isArray(message.ranges) ? message.ranges : [];

                        for (let i = 0; i < ranges.length; i++) {
                            const range = ranges[i];
                            if (!range || !Array.isArray(range.row) || !Array.isArray(range.column)) {
                                cache = flowData;
                                self.postMessage({ type: 'ready' });
                                return;
                            }

                            for (let r = range.row[0]; r <= range.row[1]; r++) {
                                const sourceRow = flowData[r];
                                if (!Array.isArray(sourceRow)) {
                                    cache[r] = sourceRow;
                                    continue;
                                }

                                ensureRow(r, sourceRow.length);

                                for (let c = range.column[0]; c <= range.column[1]; c++) {
                                    cache[r][c] = sourceRow[c];
                                }
                            }
                        }

                        self.postMessage({ type: 'ready' });
                    }
                };
            `;
            let blob = new Blob([workerSource], { type: 'text/javascript' });
            let worker = new Worker(URL.createObjectURL(blob));

            worker.onmessage = function() {
                _this.deepCopyFlowDataWorkerReady = true;
            };

            _this.deepCopyFlowDataWorker = worker;
            return worker;
        }
        catch (error) {
            _this.deepCopyFlowDataWorker = null;
            return null;
        }
    },
    deepCopyFlowData:function(flowData){
        let _this = this;

        if(_this.deepCopyFlowDataState){
            return _this.deepCopyFlowDataCache;
        }
        else{
            if(flowData == null){
                flowData = Store.flowdata;
            }

            _this.deepCopyFlowDataCache = _this.cloneFlowDataSnapshot(flowData);
            _this.deepCopyFlowDataState = true;
            return _this.deepCopyFlowDataCache;
        }
    },
    webWorkerFlowDataCache:function(flowData, options = {}){
        let _this = this;
        let { mode = 'full', ranges = null } = options;

        try{
            if(flowData == null){
                flowData = Store.flowdata;
            }

            if (mode === 'patch' && _this.deepCopyFlowDataState) {
                _this.applyFlowDataPatchToCache(flowData, ranges);
            }
            else {
                _this.deepCopyFlowDataCache = _this.cloneFlowDataSnapshot(flowData);
                _this.deepCopyFlowDataState = true;
            }

            let worker = _this.ensureFlowDataWorker();
            if (worker != null) {
                _this.deepCopyFlowDataWorkerReady = false;
                worker.postMessage({
                    type: mode === 'patch' && _this.normalizeRanges(ranges).length > 0 ? 'patch' : 'full',
                    flowData: flowData,
                    ranges: _this.normalizeRanges(ranges),
                });
            }
        }
        catch(e){
            _this.deepCopyFlowDataCache = _this.cloneFlowDataSnapshot(flowData);
            _this.deepCopyFlowDataState = true;
        }
    },

    /**
     * @param {Array} dataChe 
     * @param {Object} range 是否指定选区，默认为当前选区
     * @since Add range parameter. Update by siwei@2020-09-10. 
     */
    controlHandler: function (dataChe, range) {
        let _this = this;

        let d = _this.deepCopyFlowData(Store.flowdata);//取数据

        // let last = Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1];
        let last = range || Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1];
        let curR = last["row"] == null ? 0 : last["row"][0];
        let curC = last["column"] == null ? 0 : last["column"][0];
        let rlen = dataChe.length, clen = dataChe[0].length;

        let addr = curR + rlen - d.length, addc = curC + clen - d[0].length;
        if(addr > 0 || addc > 0){
            d = datagridgrowth([].concat(d), addr, addc, true);
        }

        for (let r = 0; r < rlen; r++) {
            let x = [].concat(d[r + curR]);
            for (let c = 0; c < clen; c++) {
                let value = "";
                if (dataChe[r] != null && dataChe[r][c] != null) {
                    value = dataChe[r][c];
                }
                x[c + curC] = value;
            }
            d[r + curR] = x;
        }

        if (addr > 0 || addc > 0) {
            jfrefreshgridall(d[0].length, d.length, d, null, Store.luckysheet_select_save, "datachangeAll");
        }
        else {
            jfrefreshrange(d, Store.luckysheet_select_save);
        }
    },
    clearRangeByindex: function (st_r, ed_r, st_c, ed_c, sheetIndex) {
        let index = getSheetIndex(sheetIndex);
        let d = $.extend(true, [], Store.luckysheetfile[index]["data"]);
        
        for (let r = st_r; r <= ed_r; r++) {
            let x = [].concat(d[r]);
            for (let c = st_c; c <= ed_c; c++) {
                formula.delFunctionGroup(r, c);
                formula.execFunctionGroup(r, c, "");
                x[c] = null;
            }
            d[r] = x;
        }

        if(sheetIndex == Store.currentSheetIndex){
            let rlen = ed_r - st_r + 1, 
                clen = ed_c - st_c + 1;
            
            if (rlen > 5000) {
                jfrefreshgrid(d, [{ "row": [st_r, ed_r], "column": [st_c, ed_c] }]);
            }
            else {
                jfrefreshrange(d, { "row": [st_r, ed_r], "column": [st_c, ed_c] });
            }
        }
        else{
            Store.luckysheetfile[index]["data"] = d;
        }
    },
    controlHandlerD: function (dataChe) {
        let _this = this;

        let d = _this.deepCopyFlowData(Store.flowdata);//取数据

        let last = Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1];
        let r1 = last["row"][0], r2 = last["row"][1];
        let c1 = last["column"][0], c2 = last["column"][1];
        let rlen = dataChe.length, clen = dataChe[0].length;

        let addr = r1 + rlen - d.length, addc = c1 + clen - d[0].length;
        if(addr >0 || addc > 0){
            d = datagridgrowth([].concat(d), addr, addc, true);
        }

        for(let r = r1; r <= r2; r++){
            for(let c = c1; c <= c2; c++){
                d[r][c] = null;
            }
        }

        for(let i = 0; i < rlen; i++){
            for(let j = 0; j < clen; j++){
                d[r1 + i][c1 + j] = dataChe[i][j];
            }
        }

        let range = [
            { "row": [r1, r2], "column": [c1, c2] },
            { "row": [r1, r1 + rlen - 1], "column": [c1, c1 + clen - 1] }
        ];

        jfrefreshgrid(d, range);
    }
};

export default editor;