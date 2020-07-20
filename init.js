var color_list = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3'];
var colors = ['#5793f3', '#d14a61', '#675bba', '#b62f46'];
var close = GOOGLE['data'].map(function (el, idx) {
    return el[1];
})
var stocks = GOOGLE['data'].map(function (el, idx) {
    return [el[0], el[1], el[3], el[2]];
})
var stock_date = GOOGLE['date'];
var volume = GOOGLE['volume'];
var csv;
var indeces = {};
var dataMA1, dataMA5, dataMA10, dataMA20, dataMA30;
var total_investment, total_gain, stock_changes, stock_changes_percent

function smoothing_line(scalars, weight) {
    last = scalars[0]
        smoothed = []
        for (var i = 0; i < scalars.length; i++) {
            smoothed_val = last * weight + (1 - weight) * scalars[i]
                smoothed.push(smoothed_val)
                last = smoothed_val
        }
        return smoothed
}

function generate_investment(strings, values) {
    colors = "";
    for (var i = 0; i < strings.length; i++) {
        if (values[i] >= 0)
            colors += "<div class='col s12 m2'><div class='card'><div class='card-content'><a class='btn-floating waves-effect waves-light green' style='width:100px;height:100px;margin-bottom:20px'><i class='material-icons' style='font-size:3rem; line-height:95px'>arrow_upward</i></a><p><h6>" + strings[i] + values[i] + "</h6></p></div></div></div>";
        else
            colors += "<div class='col s12 m2'><div class='card'><div class='card-content'><a class='btn-floating waves-effect waves-light red' style='width:100px;height:100px;margin-bottom:20px'><i class='material-icons' style='font-size:3rem; line-height:95px'>arrow_downward</i></a><p><h6>" + strings[i] + values[i] + "</h6></p></div></div></div>";
    }
    $('#color-investment').html(colors);
}

function buildConfig() {
    return {
        delimiter: $('#delimiter').val(),
        header: $('#header').prop('checked'),
        dynamicTyping: $('#dynamicTyping').prop('checked'),
        skipEmptyLines: $('#skipEmptyLines').prop('checked'),
        preview: parseInt($('#preview').val() || 0),
        step: $('#stream').prop('checked') ? stepFn : undefined,
        encoding: $('#encoding').val(),
        worker: $('#worker').prop('checked'),
        comments: $('#comments').val(),
        complete: completeFn,
        error: errorFn
    }
}

function errorFn(err, file) {
    Materialize.toast("ERROR: " + err + file, 3000)
}

function completeFn(results) {
    if (results && results.errors) {
        if (results.errors) {
            errorCount = results.errors.length;
            firstError = results.errors[0]
        }
        if (results.data && results.data.length > 0)
            rowCount = results.data.length
    }
    csv = results['data'];
    for (var i = 0; i < csv[0].length; i++)
        indeces[csv[0][i].toLowerCase()] = i;
    stocks = [];
    volume = [];
    stock_date = [];
    for (var i = 1; i < csv.length; i++) {
        if (!isNaN(csv[i][indeces['open']]) && !isNaN(csv[i][indeces['close']]) && !isNaN(csv[i][indeces['low']]) && !isNaN(csv[i][indeces['high']]) && !isNaN(csv[i][indeces['volume']])) {
            stocks.push([parseFloat(csv[i][indeces['open']]),
                    parseFloat(csv[i][indeces['close']]),
                    parseFloat(csv[i][indeces['low']]),
                    parseFloat(csv[i][indeces['high']])]);
            volume.push(csv[i][indeces['volume']]);
            stock_date.push(csv[i][indeces['date']]);
        }
    }
    close = stocks.map(function (el, idx) {
        return el[1];
    })
        plot_stock();
}

var csv, config = buildConfig();
$('#uploadcsv').change(function () {
    csv = null;
    file = document.getElementById('uploadcsv');
    if ($(this).val().search('.csv') <= 0) {
        $(this).val('');
        Materialize.toast('Only support CSV', 4000);
        return
    }
    $(this).parse({
        config: config
    })
})

function calculate_distribution(real, predict) {
    data_plot = []
    data_arr = [real, predict]
    for (var outer = 0; outer < data_arr.length; outer++) {
        data = data_arr[outer]
            max_arr = Math.max(...data)
            min_arr = Math.min(...data)
            num_bins = Math.ceil(Math.sqrt(data.length));
        kde = kernelDensityEstimator(epanechnikovKernel(max_arr / 50), arange(min_arr, max_arr, (max_arr - min_arr) / num_bins))
            kde = kde(data)
            bar_x = [],
        bar_y = []
        for (var i = 0; i < kde.length; i++) {
            bar_x.push(kde[i][0])
            bar_y.push(kde[i][1])
        }
        min_line_y = Math.min(...bar_y)
            for (var i = 0; i < bar_y.length; i++)
                bar_y[i] -= min_line_y
                data_plot.push({
                    'bar_x': bar_x,
                    'bar_y': bar_y
                })
    }
    option = {
        color: colors,

        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['real histogram', 'predict histogram']
        },
        xAxis: [{
                type: 'category',
                data: data_plot[0]['bar_x']
            }, {
                type: 'category',
                data: data_plot[1]['bar_x']
            }
        ],
        yAxis: {
            type: 'value'
        },
        series: [{
                name: 'real histogram',
                type: 'bar',
                data: data_plot[0]['bar_y']
            }, {
                name: 'predict histogram',
                type: 'bar',
                data: data_plot[1]['bar_y'].slice(0, data_plot[1]['bar_y'].length - 2)
            }
        ]
    };
    var bar_plot = echarts.init(document.getElementById('div_dist'));
    bar_plot.setOption(option, true);
}

function calculateMA(dayCount, data) {
    var result = [];
    for (var i = 0, len = data.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            sum += data[i - j][1];
        }
        result.push((sum / dayCount).toFixed(2));
    }
    return result;
}

function plot_stock() {
    dataMA1 = calculateMA(1, stocks);
    dataMA5 = calculateMA(5, stocks);
    dataMA10 = calculateMA(10, stocks);
    dataMA20 = calculateMA(20, stocks);
    dataMA30 = calculateMA(30, stocks);
    option = {
        animation: false,
        color: color_list,
        title: {
            left: 'center'
        },
        legend: {
            top: 30,
            data: ['STOCK', 'Close price', 'MA5', 'MA10', 'MA20', 'MA30']
        },
        tooltip: {
            trigger: 'axis',
            position: function (pt) {
                return [pt[0], '10%'];
            }
        },
        axisPointer: {
            link: [{
                    xAxisIndex: [0, 1]
                }
            ]
        },
        dataZoom: [{
                type: 'slider',
                xAxisIndex: [0, 1],
                realtime: false,
                start: 0,
                end: 100,
                top: 65,
                height: 20,
                handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '120%'
            }, {
                type: 'inside',
                xAxisIndex: [0, 1],
                start: 40,
                end: 70,
                top: 30,
                height: 20
            }
        ],
        xAxis: [{
                type: 'category',
                data: stock_date,
                boundaryGap: false,
                axisLine: {
                    lineStyle: {
                        color: '#777'
                    }
                },
                axisLabel: {
                    formatter: function (value) {
                        return echarts.format.formatTime('MM-dd', value);
                    }
                },
                min: 'dataMin',
                max: 'dataMax',
                axisPointer: {
                    show: true
                }
            }, {
                type: 'category',
                gridIndex: 1,
                data: stock_date,
                scale: true,
                boundaryGap: false,
                splitLine: {
                    show: false
                },
                axisLabel: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    lineStyle: {
                        color: '#777'
                    }
                },
                splitNumber: 20,
                min: 'dataMin',
                max: 'dataMax',
                axisPointer: {
                    type: 'shadow',
                    label: {
                        show: false
                    },
                    triggerTooltip: true,
                    handle: {
                        show: true,
                        margin: 30,
                        color: '#B80C00'
                    }
                }
            }
        ],
        yAxis: [{
                scale: true,
                splitNumber: 2,
                axisLine: {
                    lineStyle: {
                        color: '#777'
                    }
                },
                splitLine: {
                    show: true
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    inside: true,
                    formatter: '{value}\n'
                }
            }, {
                scale: true,
                gridIndex: 1,
                splitNumber: 2,
                axisLabel: {
                    show: false
                },
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: false
                }
            }
        ],
        grid: [{
                left: 20,
                right: 30,
                top: 110,
            }, {
                left: 20,
                right: 30,
                top: 400
            }
        ],
        graphic: [{
                type: 'group',
                left: 'center',
                top: 70,
                width: 300,
                bounding: 'raw',
                children: [{
                        id: 'MA5',
                        type: 'text',
                        style: {
                            fill: color_list[1]
                        },
                        left: 0
                    }, {
                        id: 'Close price',
                        type: 'text',
                        style: {
                            fill: color_list[5]
                        },
                        left: 'center'
                    }, { 
                        id: 'MA10',
                        type: 'text',
                        style: {
                            fill: color_list[2]
                        },
                        left: 'center'
                    }, {
                        id: 'MA20',
                        type: 'text',
                        style: {
                            fill: color_list[3]
                        },
                        right: 0
                    }
                ]
            }
        ],
        series: [{
                name: 'Volume',
                type: 'bar',
                xAxisIndex: 1,
                yAxisIndex: 1,
                itemStyle: {
                    normal: {
                        color: '#7fbe9e'
                    },
                    emphasis: {
                        color: '#140'
                    }
                },
                data: volume
            }, {
                type: 'candlestick',
                name: 'STOCK',
                data: stocks,
                itemStyle: {
                    normal: {
                        color: '#ef232a',
                        color0: '#14b143',
                        borderColor: '#ef232a',
                        borderColor0: '#14b143'
                    },
                    emphasis: {
                        color: 'black',
                        color0: '#444',
                        borderColor: 'black',
                        borderColor0: '#444'
                    }
                }
            }, {
                name: 'Close price',
                type: 'line',
                data: dataMA1,
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            }, {
                name: 'MA5',
                type: 'line',
                data: dataMA5,
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            }, {
                name: 'MA10',
                type: 'line',
                data: dataMA10,
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            }, {
                name: 'MA20',
                type: 'line',
                data: dataMA20,
                smooth: true,
                legendHoverLink: false,
                showSymbol: false,
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            }, {
                name: 'MA30',
                type: 'line',
                data: dataMA30,
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            }
        ]
    };

    var chart_stock = echarts.init(document.getElementById('div_output'));
    chart_stock.setOption(option, true);
}

$('#suggestbutton').click(function () {
    $('#learningrate').val(0.01)
    $('#timestamp').val(15)
    $('#epoch').val(10)
})
$('#suggestbutton').click()
$('#uploadparam').click(function () {
    uploadParamApi(function (data) {
        alert("OK!");
    })
})

$('#trainbutton').click(function () {

	var startDate = document.getElementById("from_date").value;
	var endDate = document.getElementById("to_date").value;
	var stockName = document.getElementById("to_stock").value;
	if(startDate == "") {
		fetch_data("FB", "2019-01-01", getFormatDate(new Date()));
	} else {
		fetch_data(stockName, startDate, endDate);
	}
})
function fetch_data(stockName, startDate, endDate) {
    $('#log').html('');
    $('#log-invest').html('');
    $('.close-first').css('display', 'block');

    fetchDataApi(stockName, startDate, endDate, function (data) {
        stocks = data.data;
        volume = data.volume;
        stock_date = data.date;
        close = stocks.map(function (el, idx) {
            return el[1];
        });
        GOOGLE = JSON.parse(JSON.stringify(data));
        plot_stock();
        //calculate_distribution(close, predicted_val);
    });
}
fetch_data("FB", "2019-01-01", getFormatDate(new Date()));
function getFormatDate(day) {
    var today = day;
    var dd = today.getDate();

    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }
    today = yyyy + '-' + mm + '-' + dd;
    return today;
}
