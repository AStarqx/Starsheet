import { hasChinaword } from './validate';
import dayjs from 'dayjs'

function isdatetime(s) {
    if (s == null || s.toString().length < 5) {
        return false;
    }
    else if(checkDateTime(formatDate(s, '-'))){
        return true;
    }
    else {
        return false;
    }

    function formatDate(numb, format) {
        const old = numb - 1;
        const t = Math.round((old - Math.floor(old)) * 24 * 60 * 60);
        const time = new Date(1900, 0, old, 0, 0, t)
        const year = time.getFullYear() ;
        const month = time.getMonth() + 1 ;
        const date = time.getDate() ;
        return year + format + (month < 10 ? '0' + month : month) + format + (date < 10 ? '0' + date : date)
    }

    function checkDateTime(str){
        var reg1 = /^(\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/;
        var reg2 = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/;

        if(!reg1.test(str) && !reg2.test(str)){
            return false;
        }

        var year = RegExp.$1,
            month = RegExp.$2,
            day = RegExp.$3;

        if(year < 1900){
            return false;
        }

        if(month > 12){
            return false;
        }

        if(day > 31){
            return false;
        }

        if(month == 2){
            if(new Date(year, 1, 29).getDate() == 29 && day > 29){
                return false;
            }
            else if(new Date(year, 1, 29).getDate() != 29 && day > 28){
                return false;
            }
        }

        return true;
    }
}

function diff(now, then) {
    return dayjs(now).diff(dayjs(then));
}

function isdatatypemulti(s) {
    let type = {};

    if (isdatetime(s)) {
        type["date"] = true;
    }

    if (!isNaN(parseFloat(s)) && !hasChinaword(s)) {
        type["num"] = true;
    }

    return type;
}

function isdatatype(s) {
    let type = "string";

    if (isdatetime(s)) {
        type = "date";
    }
    else if (!isNaN(parseFloat(s)) && !hasChinaword(s)) {
        type = "num";
    }

    return type;
}

export {
    isdatetime,
    diff,
    isdatatypemulti,
    isdatatype,
}
