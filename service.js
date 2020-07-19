function fetchDataApi(stockName, startDate, endDate, callback) {
    $.ajax({
        type: "GET",
        url: "http://localhost:5000/fetch_data",
        data: {
            stock_name: stockName,
            start_date: startDate,
            end_date: endDate
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            alert("Failed!");
        }
    });
}
function uploadParamApi(callback) {
    timestamp = parseInt($('#timestamp').val());
    epoch = parseInt($('#epoch').val());
    learningrate = parseFloat($('#learningrate').val());
    $.ajax({
        type: "GET",
        url: "http://localhost:5000/upload_params",
        data: {
            timestamp: timestamp,
            epoch: epoch,
            learningrate: learningrate
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            alert("Failed!");
        }
    });
}
function predictApi(stockName, currentDate, open, close, high, low, callback) {
    $.ajax({
        type: "GET",
        url: "http://localhost:5000/predict",
        data: {
            stock_name: stockName,
            current_date: currentDate,
            open: open,
            close: close,
            high: high,
            low: low
        },
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            alert("Failed!");
        }
    });
}
