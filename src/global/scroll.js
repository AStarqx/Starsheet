import luckysheetFreezen from '../controllers/freezen';
import { luckysheet_searcharray } from '../controllers/sheetSearch';
import { luckysheetrefreshgrid } from '../global/refresh';
import Store from '../store';
import method from '../global/method'

let pendingScrollFrameId = null;
let pendingScrollState = null;

function applyScrollState(scrollLeft, scrollTop, canvasHeight) {
    let $t = $("#luckysheet-cell-main");

    $("#luckysheet-cols-h-c").scrollLeft(scrollLeft);//列标题
    $("#luckysheet-rows-h").scrollTop(scrollTop);//行标题

    $t.scrollLeft(scrollLeft).scrollTop(scrollTop);

    $("#luckysheet-input-box-index").css({
        "left": $("#luckysheet-input-box").css("left"),
        "top": (parseInt($("#luckysheet-input-box").css("top")) - 20) + "px",
        "z-index": $("#luckysheet-input-box").css("z-index")
    }).show();

    luckysheetrefreshgrid(scrollLeft, scrollTop);

    $("#luckysheet-bottom-controll-row").css("left", scrollLeft);

    if(luckysheetFreezen.freezenhorizontaldata != null || luckysheetFreezen.freezenverticaldata != null){
        luckysheetFreezen.scrollAdapt();
    }

    method.createHookFunction("scroll", {scrollLeft, scrollTop, canvasHeight});
}

//全局滚动事件
export default function luckysheetscrollevent(isadjust) {
    let scrollLeft = $("#luckysheet-scrollbar-x").scrollLeft(), 
        scrollTop = $("#luckysheet-scrollbar-y").scrollTop(),
        canvasHeight = $("#luckysheetTableContent").height(); // canvas高度

    if (luckysheetFreezen.freezenhorizontaldata != null) {
        if (scrollTop < luckysheetFreezen.freezenhorizontaldata[2]) {
            scrollTop = luckysheetFreezen.freezenhorizontaldata[2];
            $("#luckysheet-scrollbar-y").scrollTop(scrollTop);
            return;
        }
    }

    if (luckysheetFreezen.freezenverticaldata != null) {
        if (scrollLeft < luckysheetFreezen.freezenverticaldata[2]) {
            scrollLeft = luckysheetFreezen.freezenverticaldata[2];
            $("#luckysheet-scrollbar-x").scrollLeft(scrollLeft);
            return;
        }
    }

    pendingScrollState = {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop,
        canvasHeight: canvasHeight,
    };

    if (pendingScrollFrameId != null) {
        return;
    }

    pendingScrollFrameId = window.requestAnimationFrame(function() {
        let state = pendingScrollState;
        pendingScrollFrameId = null;
        pendingScrollState = null;

        if (state == null) {
            return;
        }

        applyScrollState(state.scrollLeft, state.scrollTop, state.canvasHeight);
    });

}