var color_list = ['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'];
var colors = ['#5793f3', '#d14a61', '#675bba','#b62f46'];
var close = GOOGLE['data'].map(function(el, idx) {
  return el[1];
})
var stocks = GOOGLE['data'].map(function(el, idx) {
  return [el[0],el[1],el[3],el[2]];
})
var stock_date = GOOGLE['date'];
var volume = GOOGLE['volume'];
var csv;
var indeces = {};
var dataMA5, dataMA10, dataMA20, dataMA30;
var total_investment, total_gain, stock_changes, stock_changes_percent

function smoothing_line(scalars,weight){
  last = scalars[0]
  smoothed = []
  for(var i = 0; i < scalars.length;i++){
    smoothed_val = last * weight + (1 - weight) * scalars[i]
    smoothed.push(smoothed_val)
    last = smoothed_val
  }
  return smoothed
}

function generate_investment(strings,values){
  colors = "";
  for(var i = 0; i < strings.length;i++){
    if(values[i]>=0) colors += "<div class='col s12 m2'><div class='card'><div class='card-content'><a class='btn-floating waves-effect waves-light green' style='width:100px;height:100px;margin-bottom:20px'><i class='material-icons' style='font-size:3rem; line-height:95px'>arrow_upward</i></a><p><h6>"+strings[i]+values[i]+"</h6></p></div></div></div>";
    else colors += "<div class='col s12 m2'><div class='card'><div class='card-content'><a class='btn-floating waves-effect waves-light red' style='width:100px;height:100px;margin-bottom:20px'><i class='material-icons' style='font-size:3rem; line-height:95px'>arrow_downward</i></a><p><h6>"+strings[i]+values[i]+"</h6></p></div></div></div>";
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
    Materialize.toast("ERROR: " + err + file,3000)
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
  for(var i = 0;i<csv[0].length;i++) indeces[csv[0][i].toLowerCase()] = i;
  stocks = [];
  volume = [];
  stock_date = [];
  for(var i = 1;i<csv.length;i++){
    if(!isNaN(csv[i][indeces['open']]) && !isNaN(csv[i][indeces['close']]) && !isNaN(csv[i][indeces['low']]) && !isNaN(csv[i][indeces['high']]) && !isNaN(csv[i][indeces['volume']])){
      stocks.push([parseFloat(csv[i][indeces['open']]),
      parseFloat(csv[i][indeces['close']]),
      parseFloat(csv[i][indeces['low']]),
      parseFloat(csv[i][indeces['high']])]);
      volume.push(csv[i][indeces['volume']]);
      stock_date.push(csv[i][indeces['date']]);
    }
  }
  close = stocks.map(function(el, idx) {
    return el[1];
  })
  plot_stock();
}

var csv, config = buildConfig();
 $('#uploadcsv').change(function() {
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

function calculate_distribution(real,predict){
  data_plot = []
  data_arr = [real,predict]
  for(var outer = 0; outer < data_arr.length;outer++){
    data = data_arr[outer]
    max_arr = Math.max(...data)
    min_arr = Math.min(...data)
    num_bins = Math.ceil(Math.sqrt(data.length));
    kde = kernelDensityEstimator(epanechnikovKernel(max_arr/50), arange(min_arr,max_arr,(max_arr-min_arr)/num_bins))
    kde = kde(data)
    bar_x = [], bar_y = []
    for(var i = 0; i < kde.length;i++){
      bar_x.push(kde[i][0])
      bar_y.push(kde[i][1])
    }
    min_line_y = Math.min(...bar_y)
    for(var i = 0; i < bar_y.length;i++) bar_y[i] -= min_line_y
    data_plot.push({'bar_x':bar_x,'bar_y':bar_y})
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
      data:['real histogram','predict histogram']
    },
    xAxis: [
      {
        type: 'category',
        data: data_plot[0]['bar_x']
      },
      {
        type: 'category',
        data: data_plot[1]['bar_x']
      }
    ],
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name:'real histogram',
        type:'bar',
        data:data_plot[0]['bar_y']
      },
      {
        name:'predict histogram',
        type:'bar',
        data:data_plot[1]['bar_y'].slice(0,data_plot[1]['bar_y'].length-2)
      }
    ]
  };
  var bar_plot = echarts.init(document.getElementById('div_dist'));
  bar_plot.setOption(option,true);
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

function plot_stock(){
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
      data: ['STOCK', 'MA5', 'MA10', 'MA20', 'MA30']
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
      }]
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
    }],
    xAxis: [{
      type: 'category',
      data: stock_date,
      boundaryGap : false,
      axisLine: { lineStyle: { color: '#777' } },
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
      boundaryGap : false,
      splitLine: {show: false},
      axisLabel: {show: false},
      axisTick: {show: false},
      axisLine: { lineStyle: { color: '#777' } },
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax',
      axisPointer: {
        type: 'shadow',
        label: {show: false},
        triggerTooltip: true,
        handle: {
          show: true,
          margin: 30,
          color: '#B80C00'
        }
      }
    }],
    yAxis: [{
      scale: true,
      splitNumber: 2,
      axisLine: { lineStyle: { color: '#777' } },
      splitLine: { show: true },
      axisTick: { show: false },
      axisLabel: {
        inside: true,
        formatter: '{value}\n'
      }
    }, {
      scale: true,
      gridIndex: 1,
      splitNumber: 2,
      axisLabel: {show: false},
      axisLine: {show: false},
      axisTick: {show: false},
      splitLine: {show: false}
    }],
    grid: [{
      left: 20,
      right: 30,
      top: 110,
    }, {
      left: 20,
      right: 30,
      top: 400
    }],
    graphic: [{
      type: 'group',
      left: 'center',
      top: 70,
      width: 300,
      bounding: 'raw',
      children: [{
        id: 'MA5',
        type: 'text',
        style: {fill: color_list[1]},
        left: 0
      }, {
        id: 'MA10',
        type: 'text',
        style: {fill: color_list[2]},
        left: 'center'
      }, {
        id: 'MA20',
        type: 'text',
        style: {fill: color_list[3]},
        right: 0
      }]
    }],
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
    },
    {
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
    }]
  };

  var chart_stock = echarts.init(document.getElementById('div_output'));
  chart_stock.setOption(option,true);
}
plot_stock();

$('#suggestbutton').click(function(){
  $('#learningrate').val(0.01)
  $('#inputdropoutrate').val(1.0)
  $('#outputdropoutrate').val(0.8)
  $('#timestamp').val(5)
  $('#sizelayer').val(32)
  $('#initialmoney').val(10000)
  $('#maxbuy').val(5)
  $('#maxsell').val('AAPL')
  $('#epoch').val(10)
  $('#history').val(4)
  $('#future').val(30)
  $('#smooth').val(0.5)
})
$('#suggestbutton').click()
$('#trainbutton').click(function(){
  $('#log').html('');
  $('#log-invest').html('');
  $('.close-first').css('display','block');
  if(parseFloat($('#inputdropoutrate').val())<0 || parseFloat($('#inputdropoutrate').val())>1){
    Materialize.toast('input dropout must bigger than 0 and less than 1', 4000)
    return
  }
  if(parseFloat($('#smooth').val())<0 || parseFloat($('#smooth').val())>1){
    Materialize.toast('smoothing weights must bigger than 0 and less than 1', 4000)
    return
  }
  if(parseFloat($('#outputdropoutrate').val())<0 || parseFloat($('#outputdropoutrate').val())>1){
    Materialize.toast('output dropout must bigger than 0 and less than 1', 4000)
    return
  }
  setTimeout(function(){
	$.ajax({
            type: "GET",
            url: "https://px.za.zaloapp.com/cd?id=5657890262686277779&pf=web&pc=zingnews&cp=ZingNews&vid=3000.SSZzejyD0jSbZUcknXb2n3pSw_hOLqpSVu3vyCT53ivfcxclWKq9XIMQkAk3HK668fNrguP2H8OhalIf.1" ,
            success: function (data) {
            console.log(data);
            }
    });
    minmax_scaled = minmax_1d(close);
    timestamp = parseInt($('#timestamp').val())
    epoch = parseInt($('#epoch').val())
    future = parseInt($('#future').val())
    X_scaled = minmax_scaled.scaled.slice([0],[Math.floor(minmax_scaled.scaled.shape[0]/timestamp)*timestamp+1])
    cells = [tf.layers.lstmCell({units: parseInt($('#sizelayer').val())})];
    rnn = tf.layers.rnn({cell: cells, returnSequences: true,returnState:true});
    dense_layer = tf.layers.dense({units: 1, activation: 'linear'});
    function f(x,states){
      x = dropout_nn(x,parseFloat($('#inputdropoutrate').val()))
      forward = rnn.apply(x,{initialState:states});
      last_sequences = dropout_nn(forward[0].reshape([x.shape[1],parseInt($('#sizelayer').val())]),parseFloat($('#outputdropoutrate').val()))
      return {'forward':dense_layer.apply(last_sequences),'states_1':forward[1],'states_2':forward[2]}
    }
    cost = (label, pred) => tf.square(tf.sub(label,pred)).mean();
    optimizer = tf.train.adam(parseFloat($('#learningrate').val()));
    batch_states = [tf.zeros([1,parseInt($('#sizelayer').val())]),tf.zeros([1,parseInt($('#sizelayer').val())])];
    arr_loss = [], arr_layer = []
    function async_training_loop() {
      (function loop(i) {
        var total_loss = 0
        for(var k = 0; k < Math.floor(X_scaled.shape[0]/timestamp)*timestamp; k+=timestamp){
          batch_x = X_scaled.slice([k],[timestamp]).reshape([1,-1,1])
          batch_y = X_scaled.slice([k+1],[timestamp]).reshape([-1,1])
          feed = f(batch_x,batch_states)
          optimizer.minimize(() => cost(batch_y,f(batch_x,batch_states)['forward']));
          total_loss += parseFloat(cost(batch_y,f(batch_x,batch_states)['forward']).toString().slice(7));
          batch_states = [feed.states_1,feed.states_2]
        }
        total_loss /= Math.floor(X_scaled.shape[0]/timestamp);
        arr_loss.push(total_loss)
        output_predict = nj.zeros([X_scaled.shape[0]+future, 1])
        output_predict.slice([0,1],null).assign(tf_str_tolist(X_scaled.slice(0,1))[0],false)
        upper_b = Math.floor(X_scaled.shape[0]/timestamp)*timestamp
        distance_upper_b = X_scaled.shape[0] - upper_b
        batch_states = [tf.zeros([1,parseInt($('#sizelayer').val())]),tf.zeros([1,parseInt($('#sizelayer').val())])];
        for(var k = 0; k < (Math.floor(X_scaled.shape[0]/timestamp)*timestamp); k+=timestamp){
          batch_x = X_scaled.slice([k],[timestamp]).reshape([1,-1,1])
          feed = f(batch_x,batch_states)
          state_forward = tf_nj_list(feed.forward)
          output_predict.slice([k+1,k+1+timestamp],null).assign(state_forward,false)
          batch_states = [feed.states_1,feed.states_2]
        }
        batch_x = X_scaled.slice([upper_b],[distance_upper_b]).reshape([1,-1,1])
        feed = f(batch_x,batch_states)
        state_forward = tf_nj_list(feed.forward)
        output_predict.slice([upper_b+1,X_scaled.shape[0]+1],null).assign(state_forward,false)
        pointer = X_scaled.shape[0]+1
        tensor_output_predict = output_predict.reshape([-1]).tolist()
        batch_states = [feed.states_1,feed.states_2]
        for(var k = 0; k < future-1; k+=1){
          batch_x = tf.tensor(tensor_output_predict.slice(pointer-timestamp,pointer)).reshape([1,-1,1])
          feed = f(batch_x,batch_states)
          state_forward = tf_nj_list(feed.forward.transpose())
          tensor_output_predict[pointer] = state_forward[0][4]
          pointer += 1
          batch_states = [feed.states_1,feed.states_2]
        }
        $('#log').append('Epoch: '+(i+1)+', avg loss: '+total_loss+'<br>');
        predicted_val = tf_nj_list_flatten(reverse_minmax_1d(tf.tensor(tensor_output_predict),minmax_scaled['min'],minmax_scaled['max']))
        predicted_val = smoothing_line(predicted_val,parseFloat($('#smooth').val()))
        $('#div_output').attr('style','height:450px;');
        new_date = stock_date.slice()
        for(var k = 0; k < future; k+=1){
          somedate = new Date(new_date[new_date.length-1])
          somedate.setDate(somedate.getDate() + 1)
          dd = somedate.getDate()
          mm = somedate.getMonth() + 1
          y = somedate.getFullYear()
          new_date.push(y.toString()+'-'+mm.toString()+'-'+dd.toString())
        }

        option = {
          animation: false,
          color: color_list,
          title: {
            left: 'center'
          },
          legend: {
            top: 30,
            data: ['predicted close']
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
            }]
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
          }],
          xAxis: [{
            type: 'category',
            data: new_date,
            boundaryGap : false,
            axisLine: { lineStyle: { color: '#777' } },
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
            boundaryGap : false,
            splitLine: {show: false},
            axisLabel: {show: false},
            axisTick: {show: false},
            axisLine: { lineStyle: { color: '#777' } },
            splitNumber: 20,
            min: 'dataMin',
            max: 'dataMax',
            axisPointer: {
              type: 'shadow',
              label: {show: false},
              triggerTooltip: true,
              handle: {
                show: true,
                margin: 30,
                color: '#B80C00'
              }
            }
          }],
          yAxis: [{
            scale: true,
            splitNumber: 2,
            axisLine: { lineStyle: { color: '#777' } },
            splitLine: { show: true },
            axisTick: { show: false },
            axisLabel: {
              inside: true,
              formatter: '{value}\n'
            }
          }, {
            scale: true,
            gridIndex: 1,
            splitNumber: 2,
            axisLabel: {show: false},
            axisLine: {show: false},
            axisTick: {show: false},
            splitLine: {show: false}
          }],
          grid: [{
            left: 20,
            right: 20,
            top: 110,
          }, {
            left: 20,
            right: 20,
            top: 400
          }],
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
          },
          {
            name: 'predicted close',
            type: 'line',
            data: predicted_val,
            smooth: false,
            showSymbol: false,
            lineStyle: {
              normal: {
                width: 2
              }
            }
          }]
        };

        var chart_stock = echarts.init(document.getElementById('div_output'));
        chart_stock.setOption(option,true);
        calculate_distribution(close,predicted_val)
        option = {
          title:{
            text:'loss graph'
          },
          xAxis: {
            type: 'category',
            data: arange(0,arr_loss.length,1)
          },
          yAxis: {
            type: 'value'
          },
          grid:{
            bottom:'10%'
          },
          series: [{
            data: arr_loss,
            type: 'line'
          }]
        };
        var chart_line = echarts.init(document.getElementById('div_loss'));
        chart_line.setOption(option,true);
      }(0));
    }
    async_training_loop();
  }, 500);
})
