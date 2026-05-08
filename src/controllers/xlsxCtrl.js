// import LuckyExcel from 'luckyexcel'
import { exportSheetExcel } from '../global/exportExcel'
import formula from '../global/formula';
import luckysheetConfigsetting from "./luckysheetConfigsetting";
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

const xlsxCtrl = {
    importedSheetCelldataCache: {},
    importedSheetCellMapCache: {},
    resetImportedSheetCache: function() {
        this.importedSheetCelldataCache = {};
        this.importedSheetCellMapCache = {};
    },
    cacheImportedSheetCelldata: function(sheet) {
        if (sheet == null || sheet.index == null || !Array.isArray(sheet.celldata) || sheet.celldata.length === 0) {
            return;
        }

        let cacheKey = sheet.index.toString();

        this.importedSheetCelldataCache[cacheKey] = sheet.celldata;
        delete this.importedSheetCellMapCache[cacheKey];
        sheet.celldata = [];
    },
    hasImportedSheetCache: function(sheet) {
        if (sheet != null && sheet.index != null) {
            return this.importedSheetCelldataCache[sheet.index.toString()] != null;
        }

        return Object.keys(this.importedSheetCelldataCache).length > 0;
    },
    hydrateImportedSheet: function(sheet) {
        if (sheet == null || sheet.index == null) {
            return sheet;
        }

        if (Array.isArray(sheet.celldata) && sheet.celldata.length > 0) {
            return sheet;
        }

        let cacheKey = sheet.index.toString();
        let cachedCelldata = this.importedSheetCelldataCache[cacheKey];

        if (Array.isArray(cachedCelldata) && cachedCelldata.length > 0) {
            sheet.celldata = cachedCelldata;
            delete this.importedSheetCelldataCache[cacheKey];
            delete this.importedSheetCellMapCache[cacheKey];
        }

        return sheet;
    },
    getImportedSheetSourceCelldata: function(sheet) {
        if (sheet == null || sheet.index == null) {
            return null;
        }

        let cacheKey = sheet.index.toString();

        if (Array.isArray(sheet.celldata) && sheet.celldata.length > 0) {
            return sheet.celldata;
        }

        return this.importedSheetCelldataCache[cacheKey];
    },
    getImportedSheetCellMap: function(sheet) {
        if (sheet == null || sheet.index == null) {
            return null;
        }

        let cacheKey = sheet.index.toString();
        if (this.importedSheetCellMapCache[cacheKey] != null) {
            return this.importedSheetCellMapCache[cacheKey];
        }

        let sourceCelldata = this.getImportedSheetSourceCelldata(sheet);

        if (!Array.isArray(sourceCelldata) || sourceCelldata.length === 0) {
            return null;
        }

        let cellMap = {};
        for (let i = 0; i < sourceCelldata.length; i++) {
            let item = sourceCelldata[i];
            if (item == null) {
                continue;
            }

            if (cellMap[item.r] == null) {
                cellMap[item.r] = {};
            }

            cellMap[item.r][item.c] = item.v == null ? null : item.v;
        }

        this.importedSheetCellMapCache[cacheKey] = cellMap;
        return cellMap;
    },
    getImportedCellValue: function(sheet, row, column) {
        let cellMap = this.getImportedSheetCellMap(sheet);

        if (cellMap == null) {
            return null;
        }

        if (cellMap[row] == null || !Object.prototype.hasOwnProperty.call(cellMap[row], column)) {
            return null;
        }

        return cellMap[row][column];
    },
    getImportedRangeData: function(sheet, row, column) {
        let cellMap = this.getImportedSheetCellMap(sheet);
        let data = [];
        let rowCount = row[1] - row[0] + 1;
        let columnCount = column[1] - column[0] + 1;

        if (cellMap == null) {
            return data;
        }

        for (let r = 0; r < rowCount; r++) {
            data.push(new Array(columnCount).fill(null));
        }

        for (let r = row[0]; r <= row[1]; r++) {
            let rowData = cellMap[r];

            for (let c = column[0]; c <= column[1]; c++) {
                if (rowData != null && Object.prototype.hasOwnProperty.call(rowData, c)) {
                    data[r - row[0]][c - column[0]] = rowData[c];
                }
            }
        }

        return data;
    },
    prepareImportedSheets: function (sheets) {
        if (!Array.isArray(sheets) || sheets.length === 0) {
            return [];
        }

        this.resetImportedSheetCache();

        let activeSheetIndex = sheets.findIndex((sheet) => sheet && sheet.status == 1);
        if (activeSheetIndex < 0) {
            activeSheetIndex = 0;
        }

        return sheets.map((sheet, index) => {
            if (sheet == null) {
                return sheet;
            }

            sheet._virtualizedMaterialization = true;

            if (sheet.data != null) {
                delete sheet.data;
            }

            if (index !== activeSheetIndex) {
                sheet.load = "0";
                this.cacheImportedSheetCelldata(sheet);
            }

            return sheet;
        });
    },
    uploadExcel: async function (file) {
        const _this = this
        if(file == null){
            alert("No files wait for import");
            return;
        }
        let name = file.name;
        let suffixArr = name.split("."), suffix = suffixArr[suffixArr.length-1];
        if (suffix === 'xls') {
            file = await this.convertXLStoXLSX(file)
            if(file) suffix = 'xlsx'
        }
        if(suffix != "xlsx"){
            alert("Currently only supports the import of xlsx files");
            return;
        }
        _this.resetImportedSheetCache();
        LuckyExcel.transformExcelToLucky(file, function(exportJson, luckysheetfile){
            if(exportJson.sheets==null || exportJson.sheets.length==0){
                alert("Failed to read the content of the excel file, currently does not support xls files!");
                return;
            }
            let importedSheets = _this.prepareImportedSheets(exportJson.sheets);
            formula.cancelForceFormulaTask();
            formula.clearFunctionGroupCache();
            luckysheet.destroy();
            luckysheet.create({
                container: 'luckysheet', //luckysheet is the container id
                showinfobar: luckysheetConfigsetting.showinfobar,
                showtoolbar: luckysheetConfigsetting.showtoolbar,
                showsheetbar: luckysheetConfigsetting.showsheetbar,
                lang: 'zh',
                data: importedSheets,
                title: exportJson.info.name,
                userInfo: exportJson.info.name.creator,
                exportFileName: luckysheetConfigsetting.exportFileName,
                showtoolbarConfig: luckysheetConfigsetting.showtoolbarConfig,
                cellRightClickConfig: luckysheetConfigsetting.cellRightClickConfig,
                showsheetbarConfig: luckysheetConfigsetting.showsheetbarConfig,
                sheetRightClickConfig: luckysheetConfigsetting.sheetRightClickConfig,
                fireMousedown: luckysheetConfigsetting.fireMousedown,
                hook: luckysheetConfigsetting.hook
            });
            exportJson.sheets = null;
            importedSheets = null;
            luckysheetfile = null;
        });
    },
    exportExcel: function(sheets) {
        exportSheetExcel(sheets, luckysheetConfigsetting.exportFileName)
    },
    generateRandomId: function(prefix) {
        if(prefix == null){
            prefix = "img";
        }

        let userAgent = window.navigator.userAgent.replace(/[^a-zA-Z0-9]/g, "").split("");

        let mid = "";

        for(let i = 0; i < 12; i++){
            mid += userAgent[Math.round(Math.random() * (userAgent.length - 1))];
        }

        let time = new Date().getTime();

        return prefix + "_" + mid + "_" + time;
    },
    convertXLStoXLSX(xlsFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 创建新的 XLSX 文件
                const newWorkbook = new ExcelJS.Workbook();
                // 复制样式和数据
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const newSheet = newWorkbook.addWorksheet(sheetName);
                    
                    // 复制合并单元格信息
                    if (worksheet['!merges']) {
                        worksheet['!merges'].forEach(merge => {
                            newSheet.mergeCells(merge.s.r + 1, merge.s.c + 1, merge.e.r + 1, merge.e.c + 1);
                        })
                    }

                    Object.keys(worksheet).forEach(cellAddress => {
                        if (cellAddress[0] === '!') return; // Ignore non-cell keys
                        const cell = worksheet[cellAddress];
                        const newCell = newSheet.getCell(cellAddress);
                        
                        newCell.value = cell.v;
                        newCell.style = cell.s;
                        newCell.type = cell.t;

                        // 如果单元格有边框信息，复制边框
                        if (cell.s && cell.s.borders) {
                            newCell.style.borders = { ...cell.s.borders };
                        }
                    });

                    const sheet = workbook.Workbook.Sheets.find(s => s.name === sheetName)
                    newSheet.state = sheet.hidden === 0 ? 'visible' : 'hidden'
                });

                // 保存为 XLSX 文件
                const outputBlob = await newWorkbook.xlsx.writeBuffer();
                const xlsxFile = new File([outputBlob], xlsFile.name.replace(/\.xls$/, '.xlsx'), { type: xlsFile.type });

                resolve(xlsxFile)
            };
        
            reader.readAsArrayBuffer(xlsFile);
        })
        
    }
}

export default xlsxCtrl;