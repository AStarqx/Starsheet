
export function initialFieldsHandler(){
    //filter event handler
    $("#luckysheetDefinedFields").click(function(){
        $("#luckysheet-rightclick-menu").hide();
        $("#luckysheet-icon-conditionformat").click();
        $('div[itemvalue="definedFields"]').click();
    });

    $("#luckysheetManageRangeNameRules").click(function(){
        $("#luckysheet-rightclick-menu").hide();
        $("#luckysheet-icon-conditionformat").click();
        $('div[itemvalue="rangeName"]').click();
    });

}
