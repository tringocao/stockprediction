var close = GOOGLE['data'].map(function(el, idx) {
  return el[1];
})

var stock_date = GOOGLE['date'];
var volume = GOOGLE['volume'];

var stocks = GOOGLE['data'].map(function(el, idx) {
  return [el[0],el[1],el[3],el[2]];
})

var current_close = 0;
var previous_close = 0;



function initTable(tableID, start, end) {
	console.log('open = ' + stocks[0][0]);
	console.log('close = ' + stocks[0][1]);
	console.log('low = ' + stocks[0][2]);
	console.log('high = ' + stocks[0][3]);

  	// Get a reference to the table
  	let tableRef = document.getElementById(tableID);

    resetTable(tableID)

    var total_cols = tableRef.rows[0].cells.length;
    console.log('total_cols = ' + total_cols);

  	if (start == -1 || end == -1) {
  		let row = tableRef.insertRow(-1);
  		for (var i = 0; i < total_cols; i++) {
  			let cell = row.insertCell(i);
	  		let cell_value = document.createTextNode('N/A');
	  		cell.appendChild(cell_value);
  		}
  		return;
  	}
  	
  	for (var j = start; j <= end; j++) {

      let diff = 0;

      let current_close = Math.round((stocks[j][1] + Number.EPSILON) * 100) / 100;
      if (previous_close > 0) {
        diff = Math.round(((current_close - previous_close) + Number.EPSILON) * 100) / 100
      } else {
        diff = previous_close;
      }
      previous_close = current_close;

      var data = [
          stock_date[j],
          Math.round((stocks[j][0] + Number.EPSILON) * 100) / 100,
          Math.round((stocks[j][3] + Number.EPSILON) * 100) / 100,
          Math.round((stocks[j][2] + Number.EPSILON) * 100) / 100,
          current_close,
          volume[j],
          diff
                  ];
      createRow(tableID, data);
  	}
}


// initTable('predict-table', 0, 6);

function getDate() {
	var from_date = document.getElementById("from_date");
	var to_date = document.getElementById("to_date");
  stock_name = document.getElementById("to_stock").value;

  fetch_data(stock_name, from_date.value, to_date.value);

  console.log('stock_date = ' + stock_date);

	var from_point = -1;
	var to_point = -1;

	for (var i = 0; i < stock_date.length; i++) {
		if (stock_date[i] == from_date.value) {
			from_point = i;
		}
		if (stock_date[i] == to_date.value) {
			to_point = i;
		}
	}

  if (to_point = -1) {
    to_point = stock_date.length;
  }

	console.log("from_date = " + from_date.value);
	console.log("to_date = " + to_date.value);

	console.log("from_point = " + from_point);
	console.log("to_point = " + to_point);

	initTable('predict-table', from_point, to_point);

  plot_stock();
  			alert("OK!");
}

function resetTable(tableID) {
  let tableRef = document.getElementById(tableID);

  var total_rows = tableRef.rows.length;
  console.log('tableRef = ' + total_rows);

  if (total_rows > 1) {
    for (var i = 0; i < total_rows - 1; i++) {
      let row = tableRef.deleteRow(-1);
    }
  }

  var current_close = 0;
  var previous_close = 0;

}

function createRow(tableID, data) {
  var len = data.length;
  let tableRef = document.getElementById(tableID);
  tableRef.style = "display: all";

  let row = tableRef.insertRow(-1);
  for (var i = 0; i < len; i++) {
    let cell = row.insertCell(i);
    let cell_value = document.createTextNode(data[i]);
    cell.appendChild(cell_value);

    if (i == len - 1) {
      if (data[i] < 0) {
        cell.bgColor = '#FF0000';
      } else {
        cell.bgColor = '#00FF00';
      }
    }
  }
}

function createRowSimple(tableID, data) {
  var len = data.length;
  let tableRef = document.getElementById(tableID);
  tableRef.style = "display: all";

  let row = tableRef.insertRow(-1);
  for (var i = 0; i < len; i++) {
    let cell = row.insertCell(i);
    let cell_value = document.createTextNode(data[i]);
    cell.appendChild(cell_value);
  }
}



function putData(open, high, low, _close, _volume) {
  let tableRef = document.getElementById('predict-table');
  
  let diff = 0;
  if (previous_close > 0) {
    diff = Math.round(((_close.value - previous_close) + Number.EPSILON) * 100) / 100
  } else {
    diff = previous_close;
  }
  previous_close = _close.value;

  stock_name = document.getElementById("to_stock").value;
  open_value = open.value;
  high_value = high.value;
  low_value = low.value;
  close_value = _close.value;
  volume_value = _volume.value;

  var data = [getFormatDate(new Date()), open.value, high.value, low.value, _close.value, _volume.value, diff];


  createRow('predict-table', data);
  
  //Push data to array
  stock_date.push(getFormatDate(new Date()));
  volume.push(volume_value);

  var newStocks = [open_value, close_value, low_value, high_value];
  stocks.push(newStocks);

  close.push(close_value);

  //Draw chart
  plot_stock();

  let predictBtn = document.getElementById('predictBtn');
  predictBtn.style = "display:all";

  let putDataBtn = document.getElementById('putDataBtn');
  putDataBtn.style = "display:none";
}

var stock_name;
var open_value;
var high_value;
var low_value;
var close_value;
var volume_value;

function predict() {
  predictApi(stock_name, getFormatDate(new Date()), open_value, close_value, high_value, low_value, function (data) {
    result = data.data[0];
    result_date = data.date;

    console.log('result = ' + result);
    console.log('result_date = ' + result_date);

    for (var i = 0; i < result_date.length; i++) {
      var predict_date = result_date[i];
      var predict_close = result[i];

      var data_row = [
        predict_date,
        predict_close
      ];

      stock_date.push(predict_date);
      close.push(predict_close);
      var newStocks = [open_value, predict_close, low_value, high_value];   //  Chi co gia tri close la dung, cac gia tri con lai dang lay sai (lay cua ngay nhap vao)
      stocks.push(newStocks);

      createRowSimple('predict-result-table', data_row);
    }

    let predicted_div = document.getElementById('predicted-div');
    predicted_div.style = 'display: all';

    let predictBtn = document.getElementById('predictBtn');
    predictBtn.style = "display:none";
    

    plot_stock();

  });
}