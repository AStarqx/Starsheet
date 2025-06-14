import { chatatABC, getObjType } from "../utils/util";
import { isRealNull, isRealNum, valueIsError } from "./validate";
import { datenum_local, genarate, update } from "./format";
import server from "../controllers/server";
import luckysheetConfigsetting from "../controllers/luckysheetConfigsetting";
import Store from "../store/index";
import formula from '../global/formula';
import menuButton from '../controllers/menuButton';
import locale from "../locale/locale";


//Set cell value
function setcellvalue(r, c, d, v) {
    if (d == null) {
        d = Store.flowdata;
    }
    // 若采用深拷贝，初始化时的单元格属性丢失
    // let cell = $.extend(true, {}, d[r][c]);
    let cell = d[r] ? d[r][c] : {};
    let vupdate;
    let dateValue = ''
    if (getObjType(v) == "object") {
        let cellParams = ['ct', 'bg', 'ff', 'fc', 'bl', 'it', 'fs', 'cl', 'vt', 'ht', 'mc', 'tr', 'rt', 'tb', 'v', 'm', 'f', 'ps'];
        if (cell == null) {
            cell = v;
        } else {
            if (v.f != null) {
                cell.f = v.f;
                formula.insertUpdateFunctionGroup(r, c, Store.currentSheetIndex)
            } else if (cell.hasOwnProperty("f")) {
                delete cell.f;
            }

            if (v.spl != null) {
                cell.spl = v.spl;
            }

            if (v.ct != null) {
                cell.ct = v.ct;
                if(v.ct.s && v.ct.s.length) {
                    delete cell.m
                    delete cell.v
                }
                
            }

            if(v.bg != null){
                cell.bg = v.bg;
            }

            if(v.dd != null){
                cell.dd = v.dd;
            }

            if(v.ht != null){
                cell.ht = v.ht;
            }

            if(v.fc != null){
                cell.fc = v.fc;
            }

            if(v.ps != null) {
                cell.ps = v.ps
            }

            if(v.ct && v.ct.t === 'd' && v.m) {
                if(v.ct.fa && locale().dateFmtList.map(d => d.value).includes(v.ct.fa)) {
                    
                    let mm = isRealNum(v.v) ? v.m : v.v
                    dateValue = mm
                    if(mm) {
                        mm = mm.replaceAll('年', '-').replaceAll('月', '-').replaceAll('日', '')
                    }
                    // cell.v = menuButton.getDistanceDays('1900-1-1', v.v)
                    v.v = datenum_local(new Date(mm))
                    delete cell.qp
                }
                
            }

            if(v.v === '') {
                // delete cell.ct
                delete cell.m
            }

            for (const key in v) {
                if(cellParams.indexOf(key) == -1 && v[key] != null) {
                    cell[key] = v[key]
                }
            }
        }

        if (getObjType(v.v) == "object") {
            vupdate = v.v.v;
        } else {
            vupdate = v.v;
        }
    } else {
        if(menuButton.celldataIsDate(v) && (v.toString().indexOf('-') > -1 || menuButton.endsWithNoPunctuation(v))) {
            // v = menuButton.getDistanceDays('1900-1-1', v)
            v = datenum_local(new Date(v))
        }
        vupdate = v;
    }
    // fix #81， vupdate = ''
    if (vupdate == null) {
        if (getObjType(cell) == "object") {
            if(cell.ct && cell.ct.s) {
                cell.ct.s.forEach(item => {
                    if(!item.fc && cell.fc) item.fc = cell.fc
                    if(!item.tb && cell.tb) item.tb = cell.tb 
                });
            }
            else {
                delete cell.m;
                delete cell.v;
            }
        } else {
            cell = null;
        }

        d[r][c] = cell;

        return cell;
    }

    // 1.为null
    // 2.数据透视表的数据，flowdata的每个数据可能为字符串，结果就是cell == v == 一个字符串或者数字数据
    if (isRealNull(cell) || ((getObjType(cell) === "string" || getObjType(cell) === "number") && cell === v)) {
        cell = {};
    }

    let vupdateStr = vupdate.toString();
    if (vupdateStr.substr(0, 1) == "'") {
        cell.m = vupdateStr.substr(1);
        cell.ct = { fa: "@", t: "s" };
        cell.v = vupdateStr.substr(1);
        cell.qp = 1;
    } else if (cell.qp == 1) {
        cell.m = vupdateStr;
        cell.ct = { fa: "@", t: "s" };
        cell.v = vupdateStr;
    } else if (vupdateStr.toUpperCase() === "TRUE") {
        cell.m = "TRUE";
        cell.ct = { fa: "General", t: "b" };
        cell.v = true;
    } else if (vupdateStr.toUpperCase() === "FALSE") {
        cell.m = "FALSE";
        cell.ct = { fa: "General", t: "b" };
        cell.v = false;
    } else if (vupdateStr.substr(-1) === "%" && isRealNum(vupdateStr.substring(0, vupdateStr.length - 1))) {
        if(!dateValue || (dateValue && !menuButton.celldataIsDate(dateValue))) {
            cell.ct = { fa: "0%", t: "n" };
            cell.m = vupdate;
            cell.v = vupdateStr.substring(0, vupdateStr.length - 1) / 100;
        }
        else{
            cell.v = vupdate
            
            if(vupdate !== '' && vupdate !== undefined && vupdate !== null) {
                let mask = update(cell.ct.fa, vupdate);

                if (mask !== vupdate) {
                    cell.m = mask.toString();
                }
            }
            
        }
    } else if (valueIsError(vupdate)) {
        cell.m = vupdateStr;
        // cell.ct = { "fa": "General", "t": "e" };
        if (cell.ct != null) {
            cell.ct.t = "e";
        } else {
            cell.ct = { fa: "General", t: "e" };
        }
        cell.v = vupdate;
    } else {
        if (
            cell.f != null &&
            isRealNum(vupdate) &&
            !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(vupdate)
        ) {
            cell.v = parseFloat(vupdate);
            if (cell.ct == null) {
                cell.ct = { fa: "General", t: "n" };
            }

            if (cell.v == Infinity || cell.v == -Infinity) {
                cell.m = cell.v.toString();
            } else {
                if (cell.v.toString().indexOf("e") > -1) {
                    let len;
                    if (cell.v.toString().split(".").length == 1) {
                        len = 0;
                    } else {
                        len = cell.v
                            .toString()
                            .split(".")[1]
                            .split("e")[0].length;
                    }
                    if (len > 5) {
                        len = 5;
                    }

                    cell.m = cell.v.toExponential(len).toString();
                } else {
                    let v_p = Math.round(cell.v * 1000000000) / 1000000000;
                    if (cell.ct == null) {
                        let mask = genarate(v_p);
                        cell.m = mask[0].toString();
                    } else {
                        let mask = update(cell.ct.fa, v_p);
                        cell.m = mask.toString();
                    }

                    // cell.m = mask[0].toString();
                }
            }
        } else if (cell.ct != null && cell.ct.fa == "@") {
            cell.m = vupdateStr;
            cell.v = vupdate;
        } else if (cell.ct != null && cell.ct.fa != null && cell.ct.fa != "General") {
            if (isRealNum(vupdate)) {
                vupdate = parseFloat(vupdate);
            }

            if(['0%', '#0%', '0.00%', '#0.00%'].includes(cell.ct.fa)) {
                if(cell.m) vupdateStr = cell.m
                if (parseInt($("#luckysheet-input-box").css("top")) > 0) {
                    vupdateStr = $("#luckysheet-input-box").text()
                }
                if(vupdate !== '' && vupdate != undefined && vupdate != null && !Number.isNaN(Number(vupdate)) && vupdateStr.substr(-1) != '%') {
                    if(parseInt($("#luckysheet-input-box").css("top")) > 0) {
                        let currCellIndex = chatatABC(c) + (r + 1)
                        if(currCellIndex === $('#luckysheet-input-box-index').text()) {
                            vupdate = vupdate / 100
                        }
                    }
                }
            }
            
            let mask = update(cell.ct.fa, vupdate);

            if (mask !== '' && mask !== null && mask !== undefined && mask === vupdate) {
                //若原来单元格格式 应用不了 要更新的值，则获取更新值的 格式
                mask = genarate(vupdate);

                cell.m = mask[0].toString();
                cell.ct = mask[1];
                cell.v = mask[2];
            } else {
                cell.m = mask.toString();
                cell.v = vupdate;
            }
        } else {
            if (
                isRealNum(vupdate) &&
                !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(vupdate)
            ) {
                if (typeof vupdate === "string") {
                    let flag = vupdate.split("").every((ele) => ele == "0" || ele == ".");

                    // 1.1111111111111111 as an example, numbers within 18 characters need to be converted to numbers
                    if (flag || vupdate.length < 18) {
                        vupdate = parseFloat(vupdate);
                    }
                }
                cell.v = vupdate; /* 备注：如果使用parseFloat，1.1111111111111111会转换为1.1111111111111112 ? */
                cell.ct = { fa: "General", t: "n" };
                if (cell.v == Infinity || cell.v == -Infinity) {
                    cell.m = cell.v.toString();
                } else {
                    let mask = genarate(cell.v);

                    cell.m = mask[0].toString();
                }
            } else {
                if(!isRealNum(vupdate)) {
                    const regex = /^\d{4}年\d{1,2}月\d{1,2}日$/;
                    if(vupdate && regex.test(vupdate)) {
                        // vupdate = vupdate.replaceAll('年', '-').replaceAll('月', '-').replaceAll('日', '')
                        // vupdate = datenum_local(new Date(vupdate))
                    }
                }

                let mask = genarate(vupdate);

                cell.m = mask[0].toString();
                cell.ct = mask[1];
                cell.v = mask[2];
            }
        }
    }

    if (!server.allowUpdate && !luckysheetConfigsetting.pointEdit) {
        if (
            cell.ct != null &&
            /^(w|W)((0?)|(0\.0+))$/.test(cell.ct.fa) == false &&
            cell.ct.t == "n" &&
            cell.v != null &&
            parseInt(cell.v).toString().length > 4
        ) {
            let autoFormatw = luckysheetConfigsetting.autoFormatw.toString().toUpperCase();
            let accuracy = luckysheetConfigsetting.accuracy;

            let sfmt = setAccuracy(autoFormatw, accuracy);

            if (sfmt != "General") {
                cell.ct.fa = sfmt;
                cell.m = update(sfmt, cell.v);
            }
        }
    }

    if(d[r]) d[r][c] = cell
    return cell;
}

//new runze 根据亿万格式autoFormatw和精确度accuracy 转换成 w/w0/w0.00 or 0/0.0格式
function setAccuracy(autoFormatw, accuracy) {
    let acc = "0.";
    let fmt;

    if (autoFormatw == "TRUE") {
        if (accuracy == undefined) {
            return "w";
        } else {
            let alength = parseInt(accuracy);

            if (alength == 0) {
                return "w0";
            } else {
                acc = "w0.";

                for (let i = 0; i < alength; i++) {
                    acc += "0";
                }

                fmt = acc;
            }
        }
    } else {
        if (accuracy == undefined) {
            return "General";
        } else {
            let alength = parseInt(accuracy);

            if (alength == 0) {
                return "0";
            } else {
                for (let i = 0; i < alength; i++) {
                    acc += "0";
                }

                fmt = acc;
            }
        }
    }

    return fmt.toString();
}

export { setcellvalue, setAccuracy };
