import luckysheetConfigsetting from './luckysheetConfigsetting';
import {zoomChange} from './zoom';
import sheetmanage from './sheetmanage';
import server from './server';
import {rowLocationByIndex, colLocationByIndex,mouseposition,rowLocation,colLocation} from '../global/location';
import Store from '../store';
import { chatatABC } from '../utils/util';
import { getSheetIndex } from '../methods/get';
import { selectHightlightShow } from './select';
import { luckysheetMoveEndCell } from './sheetMove';
import method from "../global/method";

let ExcelPlaceholder = {
    "[tabName]":"&A",
    "[CurrentDate]":"&D",
    "[fileName]":"&F",
    "[background]":"&G",
    "[Shadow]":"&H",
    "[TotalPages]":"&N",
    "[pageNumber]":"&P",
    "[CurrentTime]":"&T",
    "[filePath]":"&Z",
}

export function initialPrintAreaHandler(){
    //filter event handler
    $("#luckysheetSetPrintArea").click(createPrintarea);
    $("#luckysheetResetPrintArea").click(resetPrintarea)
}

// Get the pixel value per millimeter
function getOneMmsPx (){
    let div = document.createElement("div");
    div.style.width = "1mm";
    document.querySelector("body").appendChild(div);
    let mm1 = div.getBoundingClientRect();
    let w = mm1.width;
    $(div).remove();
    return mm1.width;
}

export function viewChange(curType, preType){
    let currentSheet = sheetmanage.getSheetByIndex();

    if(currentSheet.config==null){
        currentSheet.config = {};
    }

    if(currentSheet.config.sheetViewZoom==null){
        currentSheet.config.sheetViewZoom = {};
    }

    let defaultZoom = 1, type="zoomScaleNormal";
    printLineAndNumberDelete(currentSheet);
    if(curType=="viewNormal"){
        type = "viewNormalZoomScale";
    }
    else if(curType=="viewLayout"){
        type = "viewLayoutZoomScale";
    }
    else if(curType=="viewPage"){
        type = "viewPageZoomScale";
        defaultZoom = 0.6;
        printLineAndNumberCreate(currentSheet);
    }

    

    let curZoom = currentSheet.config.sheetViewZoom[type];
    if(curZoom==null){
        curZoom = defaultZoom;
    }

    currentSheet.config.curentsheetView = curType;

    if (Store.clearjfundo) {
        Store.jfredo.push({
            "type": "viewChange",
            "curType": curType,
            "preType": preType,
            "sheetIndex": Store.currentSheetIndex,
        });
    }

    // Store.zoomRatio = curZoom;
    // server.saveParam("all", Store.currentSheetIndex, curZoom, { "k": "zoomRatio" });
    server.saveParam("cg", Store.currentSheetIndex, curType, { "k": "curentsheetView" });

    Store.currentSheetView = curType;

    zoomChange(curZoom);
}


function printLineAndNumberDelete(sheet){

}

function printLineAndNumberCreate(sheet){
    
}

function switchViewBtn($t){
    let $viewList = $t.parent(), preType=$viewList.find("luckysheet-print-viewBtn-active").attr("type");
    if($t.attr("type") == preType){
        return;
    }

    let curType = $t.attr("type");
    if(curType!=null){
        viewChange(curType, preType);
    }
    else{
        return;
    }

    $t.parent().find(".luckysheet-print-viewBtn").removeClass("luckysheet-print-viewBtn-active");
    $t.addClass("luckysheet-print-viewBtn-active");
}

export function printInitial(){
    let container = luckysheetConfigsetting.container;
    let _this = this;
    $("#"+container).find(".luckysheet-print-viewBtn").click(function(){
        switchViewBtn($(this));
    });

}

// 重设打印区域
function resetPrintarea() {
    if(Store.luckysheet_select_save.length > 1){
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();
        return;
    }
    if(Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].isPivotTable){
        return;
    }
    $('#luckysheet-printarea-selected-sheet' + Store.currentSheetIndex).remove();

    Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].printarea_select = {};
    Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].printArea = [];

    $("#luckysheet-rightclick-menu").hide();
    $("#luckysheet-cell-selected").hide();

    server.saveParam("all", Store.currentSheetIndex, null, { "k": "printarea_select" });
}

// 创建打印区域按钮
function createPrintarea() {
    if(Store.luckysheet_select_save.length > 1){
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();
        return;
    }
    if(Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].isPivotTable){
        return;
    }

    $('#luckysheet-printarea-selected-sheet' + Store.currentSheetIndex).remove();

    // let last = Store.luckysheet_select_save[0];
    // if (last["row"][0] == last["row"][1] && last["column"][0] == last["column"][1]) {
    //     let st_c, ed_c, curR = last["row"][1];

    //     for (let c = 0; c < Store.flowdata[curR].length; c++) {
    //         let cell = Store.flowdata[curR][c];

    //         if (cell != null && !isRealNull(cell.v)) {
    //             if (st_c == null) {
    //                 st_c = c;
    //             }
    //         }
    //         else if (st_c != null) {
    //             ed_c = c - 1;
    //             break;
    //         }
    //     }

    //     if (ed_c == null) {
    //         ed_c = Store.flowdata[curR].length - 1;
    //     }

    //     // Store.luckysheet_select_save = [{ "row": [curR, curR], "column": [st_c, ed_c] }];
    //     selectHightlightShow();

    //     Store.luckysheet_shiftpositon = $.extend(true, {}, last);
    //     luckysheetMoveEndCell("down", "range");
    // }
    // else if (last["row"][1] - last["row"][0] < 2) {
    //     Store.luckysheet_shiftpositon = $.extend(true, {}, last);
    //     luckysheetMoveEndCell("down", "range");
    // }

    Store.luckysheet_printarea_save = $.extend(true, {}, Store.luckysheet_select_save[0]);

    createPrintAreaOptions(Store.luckysheet_printarea_save);

    server.saveParam("all", Store.currentSheetIndex, Store.luckysheet_printarea_save, { "k": "printarea_select" });

    // 设置操作历史记录，方便撤回
    if (Store.filterchage) {
        Store.jfredo.push({ 
            "type": "printareashow", 
            "data": [], 
            "curdata": [], 
            "sheetIndex": Store.currentSheetIndex, 
            "filter_save": Store.luckysheet_printarea_save 
        });
    }

    method.createHookFunction(
        "setPrintAreaAfter",
        Store.luckysheet_printarea_save
    );
}

// 创建打印区域
export function createPrintAreaOptions(luckysheet_printarea_save, filterObj){
    $("#luckysheet-printarea-selected-sheet" + Store.currentSheetIndex).remove();

    if(luckysheet_printarea_save == null || JSON.stringify(luckysheet_printarea_save) == "{}"){
        return;
    }
    let sheetFile = sheetmanage.getSheetByIndex();
    if(Store.luckysheet_select_save != null && Store.luckysheet_select_save.length > 0){
        let file = Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)];

        if(luckysheet_printarea_save.row[0] < 0 || luckysheet_printarea_save.row[1] < 0 || luckysheet_printarea_save.column[0] < 0 || luckysheet_printarea_save.column[1] < 0){
            delete file.printarea_select
            delete file.printArea
            $('.luckysheet-printarea-selected').remove()
            return
        }

        let startCell = chatatABC(luckysheet_printarea_save.column[0]) + (luckysheet_printarea_save.row[0] + 1);
        let endCell = chatatABC(luckysheet_printarea_save.column[1]) + (luckysheet_printarea_save.row[1] + 1);
        sheetFile.printArea = [ startCell + ':' + endCell ];

        let r1 = luckysheet_printarea_save.row[0], 
            r2 = luckysheet_printarea_save.row[1];
        let c1 = luckysheet_printarea_save.column[0], 
            c2 = luckysheet_printarea_save.column[1];

        let row = Store.visibledatarow[r2], 
            row_pre = r1 - 1 == -1 ? 0 : Store.visibledatarow[r1 - 1];
        let col = Store.visibledatacolumn[c2], 
            col_pre = c1 - 1 == -1 ? 0 : Store.visibledatacolumn[c1 - 1]
        
        
        file.printarea_select = luckysheet_printarea_save;
        
        setTimeout(() => {
            let newSelectedHTML = '<div id="luckysheet-printarea-selected-sheet'+ Store.currentSheetIndex +'" class="luckysheet-printarea-selected"  style="left:'+ col_pre +'px;width:'+ (col - col_pre - 1) +'px;top:'+ row_pre +'px;height:'+ (row - row_pre - 1) +'px;display:block;border-color:#909399;z-index:20;background:none;"></div>';
            $("#luckysheet-cell-main").append(newSelectedHTML);
        }, 1);
        
    }

    $("#luckysheet-rightclick-menu").hide();
    $("#luckysheet-cell-selected").hide();
}
