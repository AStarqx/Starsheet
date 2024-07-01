import selection from './selection';
import { 
    getObjType,
    chatatABC,
    numFormat,
    luckysheetContainerFocus,
} from '../utils/util';
import { hasPartMC, isEditMode } from '../global/validate';
import { getdatabyselection, getcellvalue } from '../global/getdata';
import tooltip from '../global/tooltip';
import editor from '../global/editor';
import locale from '../locale/locale';
import Store from '../store';
import method from '../global/method';
import { refreshConfig } from '../global/api';
import imageCtrl from './imageCtrl';
import { getPasteCell } from './handler';

export function initialPasteOperation(){
    const locale_drag = locale().drag;

    //右键功能键
    //选择性粘贴保留原格式
    $("#luckysheet-copy-paste-format").click(function (event) {
        $("body .luckysheet-cols-menu").hide();
        luckysheetContainerFocus();

        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noPaste);
            }
            else{
                tooltip.info(locale_drag.noPaste, "");   
            }
            return;
        }
        
        selection.isPasteAction = true;
        pasteHandler(event)
    });

    //选择性粘贴保留值
    $("#luckysheet-copy-paste-value").click(function (event) {
        $("body .luckysheet-cols-menu").hide();
        luckysheetContainerFocus();

        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noPaste);
            }
            else{
                tooltip.info(locale_drag.noPaste, "");   
            }
            return;
        }
        
        selection.isPasteAction = true;
        pasteHandler(event, true)
    });

    async function pasteHandler(e, isValueOnly = false) {
        if (isEditMode()) {
            //此模式下禁用粘贴
            return;
        }

        if (selection.isPasteAction) {
            $("#luckysheet-rich-text-editor").blur();
            selection.isPasteAction = false;

            let txtdata = ''
            if(isValueOnly) {
                txtdata = await getClipboardContent()
            }
            else {
                txtdata = await getClipboardHtml()
            }

            //如果标示是qksheet复制的内容，判断剪贴板内容是否是当前页面复制的内容
            let isEqual = true;
            if (
                txtdata.indexOf("luckysheet_copy_action_table") > -1 &&
                Store.luckysheet_copy_save["copyRange"] != null &&
                Store.luckysheet_copy_save["copyRange"].length > 0
            ) {
                //剪贴板内容解析
                let cpDataArr = [];

                let reg = new RegExp("<tr.*?>(.*?)</tr>", "gs");
                let reg2 = new RegExp("<td.*?>(.*?)</td>", "gs");

                let regArr = txtdata.match(reg) || [];

                for (let i = 0; i < regArr.length; i++) {
                    let cpRowArr = [];

                    let reg2Arr = regArr[i].match(reg2);

                    if (reg2Arr != null) {
                        for (let j = 0; j < reg2Arr.length; j++) {
                            let cpValue = reg2Arr[j].replace(/<td.*?>/gs, "").replace(/<\/td>/gs, "");
                            cpRowArr.push(cpValue);
                        }
                    }

                    cpDataArr.push(cpRowArr);
                }

                //当前页面复制区内容
                let copy_r1 = Store.luckysheet_copy_save["copyRange"][0].row[0],
                    copy_r2 = Store.luckysheet_copy_save["copyRange"][0].row[1],
                    copy_c1 = Store.luckysheet_copy_save["copyRange"][0].column[0],
                    copy_c2 = Store.luckysheet_copy_save["copyRange"][0].column[1];

                let copy_index = Store.luckysheet_copy_save["dataSheetIndex"];

                let d;
                if (copy_index == Store.currentSheetIndex) {
                    d = editor.deepCopyFlowData(Store.flowdata);
                } else {
                    d = Store.luckysheetfile[getSheetIndex(copy_index)].data;
                }

                for (let r = copy_r1; r <= copy_r2; r++) {
                    if (r - copy_r1 > cpDataArr.length - 1) {
                        break;
                    }

                    for (let c = copy_c1; c <= copy_c2; c++) {
                        let cell = d[r][c];
                        let isInlineStr = false;
                        if (cell != null && cell.mc != null && cell.mc.rs == null) {
                            continue;
                        }

                        let v;
                        if (cell != null) {
                            if (cell.ct != null && cell.ct.fa.indexOf("w") > -1) {
                                v = d[r][c].v;
                            } else {
                                v = d[r][c].m;
                            }
                        } else {
                            v = "";
                        }

                        if (v == null && d[r][c] && d[r][c].ct && d[r][c].ct.s) {
                            v = d[r][c].ct.s.map((val) => val.v).join("");
                            isInlineStr = true;
                        }
                        if (v == null) {
                            v = "";
                        }
                        if (isInlineStr) {
                            const cpData = $(cpDataArr[r - copy_r1][c - copy_c1])
                                .text()
                                .replace(/\s|\n/g, " ");
                            const storeValue = v.replace(/\n/g, "").replace(/\s/g, " ");
                            if (cpData != storeValue) {
                                isEqual = false;
                                break;
                            }
                        } else {
                            if (cpDataArr[r - copy_r1][c - copy_c1] != v) {
                                isEqual = false;
                                break;
                            }
                        }
                    }
                }
            }

            const locale_fontjson = locale().fontjson;

            // hook
            if (!method.createHookFunction("rangePasteBefore", Store.luckysheet_select_save, txtdata)) {
                return;
            }

            if (
                txtdata.indexOf("luckysheet_copy_action_table") > -1 &&
                Store.luckysheet_copy_save["copyRange"] != null &&
                Store.luckysheet_copy_save["copyRange"].length > 0 &&
                isEqual
            ) {
                //剪切板内容 和 luckysheet本身复制的内容 一致
                if (Store.luckysheet_paste_iscut) {
                    Store.luckysheet_paste_iscut = false;
                    selection.pasteHandlerOfCutPaste(Store.luckysheet_copy_save);
                    selection.clearcopy(e);
                } else {
                    selection.pasteHandlerOfCopyPaste(Store.luckysheet_copy_save);
                }
                const range = Store.luckysheet_select_save && Store.luckysheet_select_save.length ?
                                Store.luckysheet_select_save[0] : undefined
                if(range) {
                    let d = editor.deepCopyFlowData(Store.flowdata);
                    for (let r = range.row[0]; r <= range.row[1]; r++) {
                        for (let c = range.column[0]; c <= range.column[1]; c++) {
                            method.createHookFunction("cellUpdated", r, c, {}, d[r][c], false);
                        }
                    }
                }
                refreshConfig({ 
                    range: range,
                    clearjfundo: false
                })
            } else if (txtdata.indexOf("luckysheet_copy_action_image") > -1) {
                imageCtrl.pasteImgItem();
            } else {
                const files = await getClipboardImageAsFile()
                if (txtdata.indexOf("table") > -1) {
                    $("#luckysheet-copy-content").html(txtdata);

                    let data = new Array($("#luckysheet-copy-content").find("table tr").length);
                    let colLen = 0;
                    const cellElements = "th, td";
                    $("#luckysheet-copy-content")
                        .find("table tr")
                        .eq(0)
                        .find(cellElements)
                        .each(function() {
                            let colspan = parseInt($(this).attr("colspan"));
                            if (isNaN(colspan)) {
                                colspan = 1;
                            }
                            colLen += colspan;
                        });

                    for (let i = 0; i < data.length; i++) {
                        data[i] = new Array(colLen);
                    }

                    let r = 0;
                    let borderInfo = {};
                    $("#luckysheet-copy-content")
                        .find("table tr")
                        .each(function() {
                            let $tr = $(this);
                            let c = 0;
                            $tr.find(cellElements).each(function() {
                                let $td = $(this);
                                let txt = $td.text()
                                let cell = getPasteCell($td)

                                if($td.children() && $td.children().length > 1) {
                                    let cts = []
                                    $td.children().each(function() {
                                        let $font = $(this)
                                        let txt = $font.text()
                                        if(txt.trim()) {
                                            let fontCell = getPasteCell($font)
                                            cts.push(fontCell)
                                        }
                                    })

                                    let firstText = txt.replace(cts.map(c => c.m).join(''), '')
                                    if(firstText.trim()) {
                                        let firstCell = $.extend(true, {}, cell)
                                        firstCell.m = firstText
                                        firstCell.v = firstText

                                        cts = [firstCell].concat(cts)
                                    }

                                    if(!cell.ct) {
                                        cell.ct = {}
                                    }
                                    cell.ct.s = cts
                                    
                                    delete cell.fc
                                    delete cell.m
                                }

                                while (c < colLen && data[r][c] != null) {
                                    c++;
                                }

                                if (c == colLen) {
                                    return true;
                                }

                                if (data[r][c] == null) {
                                    data[r][c] = cell;
                                    let rowspan = parseInt($td.attr("rowspan"));
                                    let colspan = parseInt($td.attr("colspan"));

                                    if (isNaN(rowspan)) {
                                        rowspan = 1;
                                    }

                                    if (isNaN(colspan)) {
                                        colspan = 1;
                                    }

                                    let r_ab = Store.luckysheet_select_save[0]["row"][0] + r;
                                    let c_ab = Store.luckysheet_select_save[0]["column"][0] + c;

                                    for (let rp = 0; rp < rowspan; rp++) {
                                        for (let cp = 0; cp < colspan; cp++) {
                                            if (rp == 0) {
                                                let bt = $td.css("border-top");
                                                if (
                                                    bt != null &&
                                                    bt.length > 0 &&
                                                    bt.substr(0, 3).toLowerCase() != "0px"
                                                ) {
                                                    let width = $td.css("border-top-width");
                                                    let type = $td.css("border-top-style");
                                                    let color = $td.css("border-top-color");
                                                    let borderconfig = menuButton.getQKBorder(width, type, color);

                                                    if (borderInfo[r + rp + "_" + (c + cp)] == null) {
                                                        borderInfo[r + rp + "_" + (c + cp)] = {};
                                                    }

                                                    borderInfo[r + rp + "_" + (c + cp)].t = {
                                                        style: borderconfig[0],
                                                        color: borderconfig[1],
                                                    };
                                                }
                                            }

                                            if (rp == rowspan - 1) {
                                                let bb = $td.css("border-bottom");
                                                if (
                                                    bb != null &&
                                                    bb.length > 0 &&
                                                    bb.substr(0, 3).toLowerCase() != "0px"
                                                ) {
                                                    let width = $td.css("border-bottom-width");
                                                    let type = $td.css("border-bottom-style");
                                                    let color = $td.css("border-bottom-color");
                                                    let borderconfig = menuButton.getQKBorder(width, type, color);

                                                    if (borderInfo[r + rp + "_" + (c + cp)] == null) {
                                                        borderInfo[r + rp + "_" + (c + cp)] = {};
                                                    }

                                                    borderInfo[r + rp + "_" + (c + cp)].b = {
                                                        style: borderconfig[0],
                                                        color: borderconfig[1],
                                                    };
                                                }
                                            }

                                            if (cp == 0) {
                                                let bl = $td.css("border-left");
                                                if (
                                                    bl != null &&
                                                    bl.length > 0 &&
                                                    bl.substr(0, 3).toLowerCase() != "0px"
                                                ) {
                                                    let width = $td.css("border-left-width");
                                                    let type = $td.css("border-left-style");
                                                    let color = $td.css("border-left-color");
                                                    let borderconfig = menuButton.getQKBorder(width, type, color);

                                                    if (borderInfo[r + rp + "_" + (c + cp)] == null) {
                                                        borderInfo[r + rp + "_" + (c + cp)] = {};
                                                    }

                                                    borderInfo[r + rp + "_" + (c + cp)].l = {
                                                        style: borderconfig[0],
                                                        color: borderconfig[1],
                                                    };
                                                }
                                            }

                                            if (cp == colspan - 1) {
                                                let br = $td.css("border-right");
                                                if (
                                                    br != null &&
                                                    br.length > 0 &&
                                                    br.substr(0, 3).toLowerCase() != "0px"
                                                ) {
                                                    let width = $td.css("border-right-width");
                                                    let type = $td.css("border-right-style");
                                                    let color = $td.css("border-right-color");
                                                    let borderconfig = menuButton.getQKBorder(width, type, color);

                                                    if (borderInfo[r + rp + "_" + (c + cp)] == null) {
                                                        borderInfo[r + rp + "_" + (c + cp)] = {};
                                                    }

                                                    borderInfo[r + rp + "_" + (c + cp)].r = {
                                                        style: borderconfig[0],
                                                        color: borderconfig[1],
                                                    };
                                                }
                                            }

                                            if (rp == 0 && cp == 0) {
                                                continue;
                                            }

                                            data[r + rp][c + cp] = { mc: { r: r_ab, c: c_ab } };
                                        }
                                    }

                                    if (rowspan > 1 || colspan > 1) {
                                        let first = { rs: rowspan, cs: colspan, r: r_ab, c: c_ab };
                                        data[r][c].mc = first;
                                    }
                                }

                                c++;

                                if (c == colLen) {
                                    return true;
                                }
                            });

                            r++;
                        });

                    Store.luckysheet_selection_range = [];
                    selection.pasteHandler(data, borderInfo);
                    $("#luckysheet-copy-content").empty();
                }

                // //复制的是图片
                // else if (files.length) {
                //     imageCtrl.insertImg(files[0], Store.currentImgId ? 2 : 1);

                //     return;
                // } 
                else {
                    // txtdata = clipboardData.getData("text/plain");
                    selection.pasteHandler(txtdata);

                    const range = Store.luckysheet_select_save && Store.luckysheet_select_save.length ?
                                Store.luckysheet_select_save[0] : undefined
                    if(range) {
                        let d = editor.deepCopyFlowData(Store.flowdata);
                        for (let r = range.row[0]; r <= range.row[1]; r++) {
                            for (let c = range.column[0]; c <= range.column[1]; c++) {
                                method.createHookFunction("cellUpdated", r, c, {}, d[r][c], false);
                            }
                        }
                    }
                    refreshConfig({ 
                        range: range,
                        clearjfundo: false
                    })
                }
                $("#luckysheet-copy-content").empty();
            }
        } else if ($(e.target).closest("#luckysheet-rich-text-editor").length > 0) {
            // 阻止默认粘贴
            e.preventDefault();

            let clipboardData = window.clipboardData; //for IE
            if (!clipboardData) {
                // for chrome
                clipboardData = e.originalEvent.clipboardData;
            }
            let text = clipboardData.getData("text/plain");
            // 插入
            document.execCommand("insertText", false, text);
        }
    }

    async function getClipboardHtml() {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (let i = 0; i < clipboardItems.length; i++) {
            const clipboardItem = clipboardItems[i];
            if (clipboardItem.types.includes('text/html')) {
              // 处理HTML文件
              const htmlBlob = await clipboardItem.getType('text/html');
              const htmlText = await htmlBlob.text();
              return htmlText
            }
            return ''
          }
        } catch (err) {
          console.error('无法访问剪贴板', err);
          return ''
        }
    }

    async function getClipboardContent() {
        try {
          const text = await navigator.clipboard.readText();
          return text
        } catch (err) {
          console.error('无法访问剪贴板', err);
          return ''
        }
    }

    async function getClipboardImageAsFile() {
        try {
          const clipboardItems = await navigator.clipboard.read();
          let files = []
          for (let i = 0; i < clipboardItems.length; i++) {
            const clipboardItem = clipboardItems[i];
            if (clipboardItem.types.includes('image/png') || clipboardItem.types.includes('image/jpeg')) {
              // 处理图像文件
              const imageBlob = await clipboardItem.getType('image/*');
              const file = new File([imageBlob], 'image.png', { type: imageBlob.type });
              files.push(file)
            }
          }
          return files
        } catch (err) {
        //   console.error('无法访问剪贴板', err);
          return []
        }
        
    }
}