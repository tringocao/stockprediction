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
            //Do Something to handle error
            alert("Faild!");
        }
    });
}
function uploadParamApi(callback) {
    timestamp = parseInt($('#timestamp').val());
    epoch = parseInt($('#epoch').val());
    learningrate = parseFloat($('#learningrate').val());
    $.ajax({
        type: "GET",
        url: "http://localhost:5000/upload_param",
        data: {
            timestamp: timestamp,
            epoch: epoch,
            learningrate: learningrate
        },
        success: function (data) {
            callback();
        },
        error: function (xhr) {
            alert("Faild!");
        }
    });
}
