import server from './server';
import Store from '../store';
import { getSheetIndex } from '../methods/get';

// 创建自定义区域
export function createCustomArea() {
    if(Store.luckysheet_select_save.length > 1){
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();
        return;
    }
    if(Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].isPivotTable){
        return;
    }

    let luckysheet_custom_area_save = $.extend(true, {}, Store.luckysheet_select_save[0]);

    createCustomAreaOptions(luckysheet_custom_area_save);

    server.saveParam("all", Store.currentSheetIndex, luckysheet_custom_area_save, { "k": 'custom_area_select' })
}

// 创建区域
export function createCustomAreaOptions(luckysheet_custom_area_save){
    $("#luckysheet-printarea-selected-sheet" + Store.currentSheetIndex).remove();

    if(luckysheet_custom_area_save == null || JSON.stringify(luckysheet_custom_area_save) == "{}"){
        return;
    }
    if(Store.luckysheet_select_save != null && Store.luckysheet_select_save.length > 0){
        let file = Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)];
        file.custom_area_select = luckysheet_custom_area_save;
    }

    $("#luckysheet-rightclick-menu").hide();
    $("#luckysheet-cell-selected").hide();
}
