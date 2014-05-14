function MeasureInfo(measureListTable) {
	core.on('oci-measure-list', function(labels, data) {
		measureListTable.innerHTML = "";
		var head = measureListTable.createTHead().insertRow();
		for (var i=0; i<labels.length; i++) head.insertCell(-1).textContent = labels[i];
		head.insertCell(-1).textContent = "delta";
		head.insertCell(-1).textContent = "map";
		
		//var body = measureListTable.createTBody();
		var body = document.createElement("tbody");
		measureListTable.appendChild(body);
		for (var i=0; i<data.length; i++) {
			var row = body.insertRow(-1);
			var vals = data[i];
			for (var j=0; j<vals.length; j++) row.insertCell(-1).textContent = vals[j];
			
			//TODO: use correct indeces
			row.insertCell(-1).textContent = i>0
				? (utils.disBetween(vals[6], vals[5], data[i-1][6], data[i-1][5])*10|0)/10
				: "--";
			
			var pos = vals[6]+"%2C"+vals[5];
			row.insertCell(-1).innerHTML = "<a href='http://maps.yandex.ru/?ll="+pos+"&z=12&l=map&pt="+pos+"'>map</a>";
			
			var delBtn = document.createElement("button");
			//delBtn.style.padding = 0;
			//delBtn.style.margin = 0;
			//delBtn.style.borderBottom = "none";
			delBtn.textContent = "X";
			//TODO: emit without array, use bind here
			delBtn.onclick = (function(id){ return function(){ core.emit('oci-req-measure-delete', [id]) } })(vals[0]);
			row.insertCell(-1).appendChild(delBtn);
		}
	});
	
	function markRowsByIds(id2col) {
		var rows = measureListTable.rows;
		for (var i=0; i<rows.length; i++) {
			var id = rows[i].cells[0].textContent;
			var col = id2col[id];
			if (col === undefined) continue;
			rows[i].style.backgroundColor = col;
		}
	}
	core.on('measure-list-opt', function(idsToRemove) {
		var id2col = {};
		for (var i=0; i<idsToRemove.length; i++) id2col[idsToRemove[i]] = "#FAA";
		markRowsByIds(id2col);
	});
	
	core.on('oci-measure-delete', function(id) {
		var rows = measureListTable.rows;
		for (var i=0; i<rows.length; i++) {
			if (rows[i].cells[0].textContent != id) continue;
			measureListTable.deleteRow(i);
		}
	});
}
