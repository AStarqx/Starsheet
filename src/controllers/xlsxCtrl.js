// import LuckyExcel from 'luckyexcel'
import { exportSheetExcel } from '../global/exportExcel'
import luckysheetConfigsetting from "./luckysheetConfigsetting";
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

const xlsxCtrl = {
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
        LuckyExcel.transformExcelToLucky(file, function(exportJson, luckysheetfile){
            if(exportJson.sheets==null || exportJson.sheets.length==0){
                alert("Failed to read the content of the excel file, currently does not support xls files!");
                return;
            }
            luckysheet.destroy();
            luckysheet.create({
                container: 'luckysheet', //luckysheet is the container id
                showinfobar: luckysheetConfigsetting.showinfobar,
                showtoolbar: luckysheetConfigsetting.showtoolbar,
                showsheetbar: luckysheetConfigsetting.showsheetbar,
                lang: 'zh',
                data: exportJson.sheets,
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
                console.log(workbook)
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