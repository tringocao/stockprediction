var close = GOOGLE['data'].map(function(el, idx) {
  return el[1];
})

var stock_date = GOOGLE['date'];
var volume = GOOGLE['volume'];

var stocks = GOOGLE['data'].map(function(el, idx) {
  return [el[0],el[1],el[3],el[2]];
})


function initTable(tableID, start, end) {
	console.log('open = ' + stocks[0][0]);
	console.log('close = ' + stocks[0][1]);
	console.log('low = ' + stocks[0][2]);
	console.log('high = ' + stocks[0][3]);

  	// Get a reference to the table
  	let tableRef = document.getElementById(tableID);
  	console.log('tableRef = ' + tableRef.rows.length);

  	if (tableRef.rows.length > 1) {
	  	for (var i = 0; i < tableRef.rows.length - 1; i++) {
	  		let row = tableRef.deleteRow(-1);
	  	}
  	}

  	if (start == end && end == 0) {
  		let row = tableRef.insertRow(-1);
  		for (var i = 0; i < 6; i++) {
  			let cell = row.insertCell(i);
	  		let cell_value = document.createTextNode('N/A');
	  		cell.appendChild(cell_value);
  		}
  		return;
  	}
  	
  	for (var j = start; j <= end; j++) {
  		let row = tableRef.insertRow(-1);
  		let value = 0;

  		// Date
  		let cell = row.insertCell(0);
  		let cell_value = document.createTextNode(stock_date[j]);
  		cell.appendChild(cell_value);

  		// Open
  		cell = row.insertCell(1);

  		value = Math.round((stocks[j][0] + Number.EPSILON) * 100) / 100
  		cell_value = document.createTextNode(value);
  		cell.appendChild(cell_value);

  		// High
  		cell = row.insertCell(2);

  		value = Math.round((stocks[j][3] + Number.EPSILON) * 100) / 100
  		cell_value = document.createTextNode(value);

  		cell.appendChild(cell_value);


  		// Low
  		cell = row.insertCell(3);

  		value = Math.round((stocks[j][2] + Number.EPSILON) * 100) / 100
  		cell_value = document.createTextNode(value);

  		cell.appendChild(cell_value);


  		// Close
  		cell = row.insertCell(4);

  		value = Math.round((stocks[j][1] + Number.EPSILON) * 100) / 100
  		cell_value = document.createTextNode(value);

  		cell.appendChild(cell_value);

  		// Volume
  		cell = row.insertCell(5);
  		cell_value = document.createTextNode(volume[j]);
  		cell.appendChild(cell_value);
  	}

  	
}


// initTable('predict-table', 0, 6);

function getDate() {
	var from_date = document.getElementById("from_date");
	var to_date = document.getElementById("to_date");

	var from_point = 0;
	var to_point = 0;

	for (var i = 0; i < stock_date.length; i++) {
		if (stock_date[i] == from_date.value) {
			from_point = i;
		}
		if (stock_date[i] == to_date.value) {
			to_point = i;
		}
	}

	console.log("from_date = " + from_date.value);
	console.log("to_date = " + to_date.value);

	console.log("from_point = " + from_point);
	console.log("to_point = " + to_point);

	initTable('predict-table', from_point, to_point);

}