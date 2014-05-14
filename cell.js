function CellInfo(table) {
	var fields = ['lac', 'cid', 'rssi', 'pos'];
	var cell_cache = {};
	
	var nop = droid.getNetworkOperator().result; // assume network operator will not change during measure
	var mcc = nop.substr(0, 3);
	var mnc = nop.substr(3);
	
	var head = table.createTHead().insertRow();
	for (var i=0; i<fields.length; i++){ head.insertCell(-1).textContent = fields[i]; }
	
	var body = document.createElement("tbody");
	table.appendChild(body);
	
	function getCordsFor(lac, cid) {
		if (cid == -1) return null;
		var pos = cell_cache[lac+":"+cid];
		if (pos) return pos;
		if (pos === null) return "unavaliable";
		core.emit('oci-req-cell-pos', [mcc, mnc, lac, cid]);
		return null;
	}
	
	function update() {
		var body = table.tBodies[0];
		body.innerHTML = "";
		
		var res = droid.getCellLocation().result;
		var row = body.insertRow(-1);
		row.insertCell(-1).textContent = res.lac;
		row.insertCell(-1).textContent = res.cid;
		row.insertCell(-1);
		row.insertCell(-1).textContent = getCordsFor(res.lac, res.cid);
		
		var ncRes = droid.getNeighboringCellInfo().result;
		for (var i=0; i<ncRes.length; i++) {
			var row = body.insertRow(-1);
			row.insertCell(-1);
			row.insertCell(-1).textContent = ncRes[i].cid;
			row.insertCell(-1).textContent = ncRes[i].rssi;
			row.insertCell(-1).textContent = getCordsFor(res.lac, ncRes[i].cid);
		}
	}
	
	this.update = update;
	
	core.on('oci-cell-pos-upd', function(lac, cid, lon, lat, cache) {
		cell_cache = cache;
	});
}


/*if (body.rows.length > res.length) {
	for (var i=res.length; i<table.rows.length; i++){ body.deleteRow(i) }
} else
if (body.rows.length < res.length) {
	for (var i=table.rows.length; i<res.length; i++){ body.insertRow(-1) }
}*/
