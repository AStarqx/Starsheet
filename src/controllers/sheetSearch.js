function luckysheetbinary_search(arr, key) {
    let low = 0, high = arr.length - 1;
    
    while (low <= high) {
        let mid = parseInt((high + low) / 2);
        
        if (key < arr[mid] && (mid == 0 || key >= arr[mid - 1])) {
            return mid;
        } 
        else if (key >= arr[mid]) {
            low = mid + 1;
        } 
        else if (key < arr[mid]) {
            high = mid - 1;
        }
        else {
            return -1;
        }
    }
}

function luckysheetorder_searchX(arr, x) {
    let i = 0, 
        column = 0, 
        column_pre = 0, 
        column_index = -1, 
        i_ed = arr.length - 1;

    while (i < arr.length && i_ed >= 0 && i_ed >= i) {
        column = arr[i_ed];

        if (i_ed == 0) {
            column_pre = 0;
        }
        else {
            column_pre = arr[i_ed - 1];
        }

        if (x >= column_pre) {
            column_index = i_ed;
            break;
        }

        column = arr[i];

        if (i == 0) {
            column_pre = 0;
        }
        else {
            column_pre = arr[i - 1];
        }

        if (x >= column_pre) {
            column_index = i;
            break;
        }
        i++;
        i_ed--;
    }
    return column_index;
}

function luckysheetorder_search(arr, y) {
    let i = 0, 
        row = 0, 
        row_pre = 0, 
        row_index = -1, 
        i_ed = arr.length - 1;

    while (i < arr.length && i_ed >= 0 && i_ed >= i) {
        row = arr[i_ed];

        if (i_ed == 0) {
            row_pre = 0;
        }
        else {
            row_pre = arr[i_ed - 1];
        }

        if (y >= row_pre && y < row) {
            row_index = i_ed;
            break;
        }

        row = arr[i];

        if (i == 0) {
            row_pre = 0;
        }
        else {
            row_pre = arr[i - 1];
        }

        if (y >= row_pre && y < row) {
            row_index = i;
            break;
        }

        i++;
        i_ed--;
    }

    return row_index;
}

function luckysheet_searcharrayX(arr, x) {
    let index = arr.length - 1;

    if (arr.length < 40 || x <= arr[20] || x >= arr[index - 20]) {
        index = luckysheetorder_searchX(arr, x);
    }
    else {
        index = luckysheetorder_searchX(arr, x);
    }

    return index;
}

function luckysheet_searcharray(arr, y) {
    let index = arr.length - 1;

    if (arr.length < 40 || y <= arr[20] || y >= arr[index - 20]) {
        index = luckysheetorder_search(arr, y);
    }
    else {
        index = luckysheetbinary_search(arr, y);
    }

    return index;
}

export {
    luckysheet_searcharray,
    luckysheet_searcharrayX
}