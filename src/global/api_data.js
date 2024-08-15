import Store from "../store";
import tooltip from "./tooltip";
import locale from "../locale/locale";
import method from './method';
import formula from './formula';
import sheetmanage from '../controllers/sheetmanage';
import luckysheetformula from './formula';
import menuButton from '../controllers/menuButton';

import { setAccuracy,setcellvalue } from "./setdata";
import { isRealNull, valueIsError, isRealNum, isEditMode, hasPartMC } from "./validate";
import { getSheetIndex, getluckysheet_select_save, getluckysheetfile } from "../methods/get";
import { jfrefreshgrid2Data } from "./refresh";
import { replaceHtml, getObjType, chatatABC, luckysheetactiveCell } from "../utils/util";
import { luckysheetDeleteCell, luckysheetextendtable, luckysheetdeletetable } from "./extend";

/**
 * 设置单元格的值
 *
 * 关键点：如果设置了公式，则需要更新公式链insertUpdateFunctionGroup，如果设置了不是公式，判断之前是公式，则需要清除公式delFunctionGroup
 *
 * @param {Number} row 单元格所在行数；从0开始的整数，0表示第一行
 * @param {Number} column 单元格所在列数；从0开始的整数，0表示第一列
 * @param {Object | String | Number} value 要设置的值；可以为字符串或数字，或为符合Luckysheet单元格格式的对象
 * @param {Object} options 可选参数
 * @param {Number} options.order 工作表索引；默认值为当前工作表索引
 * @param {Boolean} options.isRefresh 是否刷新界面；默认为`true`
 * @param {Boolean} options.triggerBeforeUpdate 是否触发更新前hook；默认为`true`
 * @param {Boolean} options.triggerUpdated 是否触发更新后hook；默认为`true`
 * @param {Function} options.success 操作结束的回调函数
 */
export function setCellValue(row, column, value, options = {}) {
    if (!isRealNum(row) || !isRealNum(column)) {
        return tooltip.info('The row or column parameter is invalid.', '');
    }
    let {
        order = getSheetIndex(Store.currentSheetIndex),
        isRefresh = true,
        triggerBeforeUpdate = true,
        triggerUpdated = true,
        clearjfundo = true,
        success
    } = {...options}

    let file = Store.luckysheetfile[order];

    if(file == null){
        return tooltip.info("The order parameter is invalid.", "");
    }

    /* cell更新前触发  */
    if (triggerBeforeUpdate && !method.createHookFunction("cellUpdateBefore", row, column, value, isRefresh)) {
        /* 如果cellUpdateBefore函数返回false 则不执行后续的更新 */
        return;
    }

    let data = $.extend(true, [], file.data);
    if(data.length == 0){
        data = sheetmanage.buildGridData(file);
    }

    let oldValue
    if (Store.flowdata[row] && Store.flowdata[row][column]) {
      oldValue = JSON.stringify(Store.flowdata[row][column]);
    }

    // luckysheetformula.updatecell(row, column, value);
    let formatList = {
        //ct:1, //celltype,Cell value format: text, time, etc.
        bg: 1,//background,#fff000
        ff: 1,//fontfamily,
        fc: 1,//fontcolor
        bl: 1,//Bold
        it: 1,//italic
        fs: 1,//font size
        cl: 1,//Cancelline, 0 Regular, 1 Cancelline
        un: 1,//underline, 0 Regular, 1 underlines, fonts
        vt: 1,//Vertical alignment, 0 middle, 1 up, 2 down
        ht: 1,//Horizontal alignment,0 center, 1 left, 2 right
        mc: 1, //Merge Cells
        tr: 1, //Text rotation,0: 0、1: 45 、2: -45、3 Vertical text、4: 90 、5: -90
        tb: 1, //Text wrap,0 truncation, 1 overflow, 2 word wrap
        //v: 1, //Original value
        //m: 1, //Display value
        rt:1, //text rotation angle 0-180 alignment
        //f: 1, //formula
        qp:1 //quotePrefix, show number as string
    }

    if(value == null || value.toString().length == 0){
        formula.delFunctionGroup(row, column);
        value = setcellvalue(row, column, data, value);
    }
    else if(value instanceof Object){
        let curv = {};
        if(isRealNull(data[row])){
            data[row] = {};
        }
        if(isRealNull(data[row][column])){
            data[row][column] = {};
        }
        let cell = data[row][column];
        if(value.f!=null && value.v==null){
            curv.f = value.f;
            if(value.ct!=null){
                curv.ct = value.ct;
            }
            data = luckysheetformula.updatecell(row, column, curv, false).data;//update formula value
        }
        else{
            if(value.ct!=null){
                curv.ct = value.ct;
            }
            if(value.f!=null){
                curv.f = value.f;
            } else {
                delete curv.f
                formula.delFunctionGroup(row, column, order);
            }
            if(value.v!=null){
                curv.v = value.v;
            }
            else {
                curv.v = cell.v;
            }
            if(value.m!=null){
                curv.m = value.m;
            }
            let newvalue = setcellvalue(row, column, data, curv);//update text value
            value = {...value, ...newvalue}
        }
        for(let attr in value){
            let v = value[attr];
            if(attr in formatList){
                menuButton.updateFormatCell(data, attr, v, row, row, column, column);//change range format
            }
            else {
                cell[attr] = v;
            }
        }
        data[row][column] = cell;
    }
    else{
        if(value.toString().substr(0,1)=="=" || value.toString().substr(0,5)=="<span"){
            data = luckysheetformula.updatecell(row, column, value, false).data;//update formula value or convert inline string html to object
        }
        else{
            formula.delFunctionGroup(row, column);
            setcellvalue(row, column, data, value);
        }
    }

    jfrefreshgrid2Data(data, [{ "row": [row, row], "column": [column, column] }], null, true, true, clearjfundo);//update data, meanwhile refresh canvas and store data to history

    if (success && typeof success === 'function') {
        success(data);
    }
}

/**
 * 清除指定工作表指定单元格的内容，返回清除掉的数据，不同于删除单元格的功能，不需要设定单元格移动情况
 * @param {Number} row 单元格所在行数；从0开始的整数，0表示第一行
 * @param {Number} column 单元格所在列数；从0开始的整数，0表示第一列
 * @param {Object} options 可选参数
 * @param {Number} options.order 工作表索引；默认值为当前工作表索引
 * @param {Function} options.success 操作结束的回调函数
 */
export function clearCell(row, column, options = {}) {
    if (!isRealNum(row) || !isRealNum(column)) {
        return tooltip.info('Arguments row and column cannot be null or undefined.', '')
    }

    let curSheetOrder = getSheetIndex(Store.currentSheetIndex);
    let {
        order = curSheetOrder,
        isRefresh = true,
        deleteCellParams = [],
        clearjfundo = true,
        success
    } = {...options}

    let file = Store.luckysheetfile[order]
    let cell = undefined
    let targetSheetData = []
    let index = undefined
    if(file) {
        index = file.index
    }

    if(file && isRefresh) {
        targetSheetData = $.extend(true, [], file.data);
        if(targetSheetData[row]) {
            cell = targetSheetData[row][column];
        }
    }

    if(getObjType(cell) == "object"){
        if(deleteCellParams && deleteCellParams.length) {
            for (const key in cell) {
                if(deleteCellParams.indexOf(key) > -1) {
                    if(key == 'f') {
                        formula.delFunctionGroup(row, column, index);
                    }
                    delete cell[key];
                }
            }
        }
        else {
            delete cell["m"];
            delete cell["v"];
            if(cell["bg"] != null) {
                delete cell["bg"];
            }
    
            if(cell['fc'] != null){
                delete cell['fc'];
            }
    
            if(cell["f"] != null){
                formula.delFunctionGroup(row, column, index);
    
                delete cell["f"];
                delete cell["spl"];
            }
    
            if(cell['ps'] != null) {
                delete cell['ps']
            }
    
            if(cell['dd'] != null) {
                delete cell['dd']
            }
        }
    }
    else{
        cell = null;
    }

    if(targetSheetData[row]) {
        if(!targetSheetData[row][column]) {
            targetSheetData[row][column] = {}
        }
        targetSheetData[row][column] = cell
    }

    jfrefreshgrid2Data(targetSheetData, [{ row: [row, row], column: [column, column] }], null, true, true, clearjfundo)

    if (success && typeof success === 'function') {
        success(cell)
    }
}

/**
 * 删除指定工作表指定单元格，返回删除掉的数据，同时，指定是右侧单元格左移还是下方单元格上移
 * @param {String} move 删除后，右侧还是下方的单元格移动。可选值为 'left'、'up'
 * @param {Number} row 单元格所在行数；从0开始的整数，0表示第一行
 * @param {Number} column 单元格所在列数；从0开始的整数，0表示第一列
 * @param {Object} options 可选参数
 * @param {Number} options.order 工作表索引；默认值为当前工作表索引
 * @param {Function} options.success 操作结束的回调函数
 */
export function deleteCell(move, row, column, options = {}) {
    let moveTypes = ['left', 'up'];
    if (!move || moveTypes.indexOf(move) < 0) {
        return tooltip.info('Arguments move cannot be null or undefined and its value must be \'left\' or \'up\'', '')
    }

    if (!isRealNum(row) || !isRealNum(column)) {
        return tooltip.info('Arguments row and column cannot be null or undefined.', '')
    }

    let curSheetOrder = getSheetIndex(Store.currentSheetIndex);
    let {
        order = curSheetOrder,
        success
    } = {...options}

    let moveType = 'move' + move.replace(move[0], move[0].toUpperCase()); // left-moveLeft;  up-moveUp

    let sheetIndex;
    if(order){
        if(Store.luckysheetfile[order]){
            sheetIndex = Store.luckysheetfile[order].index;
        }
    }

    luckysheetDeleteCell(moveType, row, row, column, column, sheetIndex);

    if (success && typeof success === 'function') {
        success()
    }
}