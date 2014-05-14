//TODO: gpsFieldsMap to array
//TODO: oci-REQ-measure-add

function MeasureContainer() {
	var min_move_dis = 30;
	var data = {};
	var lastGPS = null;
	//var gpsFieldsMap = {longitude: 'lon', latitude: 'lat', accuracy: 'rating', speed: 'speed', bearing: 'direction', time: 'time'};
	var gpsFields = "longitude latitude accuracy speed bearing time".split(" ");
	
	//--------------------------
	// Aggregating measures
	//--------------------------
	function complexAddition(arr, gps) {
		var replaced_once = false;
		var can_be_added = true;
		for (var i=0; i<arr.length; i++) {
			var res = utils.whichMeasureToUse(
				arr[i].longitude, arr[i].latitude, arr[i].accuracy,
				gps.longitude,    gps.latitude,    gps.accuracy,
				min_move_dis);
			if (res != utils.USE_BOTH) can_be_added = false;
			if (res != utils.USE_SECOND) continue;
			
			if (replaced_once) {
				arr.splice(i, 1);
				i -= 1;
			} else {
				arr[i] = gps;
				replaced_once = true;
			}
		}
		
		if (can_be_added && !replaced_once) {
			arr.push(gps);
		}
	}
	
	function add(lac, cid, gps) {
		var key = lac+":"+cid;
		if (key in data) {
			complexAddition(data[key], gps);
		} else {
			data[key] = [gps];
		}
		lastGPS = gps;
	}
	
	//----------------------------------
	// Optimizing existing measures
	//----------------------------------
	function optimizeMeasures(labels, data) {
		data = data.slice();
		var ilon = labels.indexOf('lon');
		var ilat = labels.indexOf('lat');
		var iacc = labels.indexOf('rating');
		var imcc = labels.indexOf('mcc');
		var imnc = labels.indexOf('mnc');
		var ilac = labels.indexOf('lac');
		var icid = labels.indexOf('cellid');
		var iid = labels.indexOf('id');
		var idsToRemove = [];
		
		for (var i=0; i<data.length-1; i++) {
			var d1 = data[i];
			var d2 = data[i+1];
			
			if (d1[icid]!=d2[icid] || d1[ilac]!=d2[ilac] ||
			    d1[imnc]!=d2[imnc] || d1[imcc]!=d2[imcc]) continue;
			
			var res = utils.whichMeasureToUse(
				d1[ilon], d1[ilat], d1[iacc],
				d2[ilon], d2[ilat], d2[iacc], min_move_dis);
			
			if (res == utils.USE_BOTH) continue;
			
			if (res == utils.USE_FIRST) {
				data.splice((1+i--), 1);
				idsToRemove.push(d2[iid]);
			} else {
				data.splice(i--, 1);
				idsToRemove.push(d1[iid]);
			}
		}
		
		core.emit('measure-list-opt', [idsToRemove]);
	}
	core.on('oci-measure-list', optimizeMeasures);
	
	//-----------------------------
	// Filling table with data
	//-----------------------------
	//core.emit('harvester-data', [["lac", "cid"].concat(gpsFields), null]);
	function prepareTable(table) {
		var head = table.createTHead().insertRow();
		head.insertCell(-1).textContent = 'lac';
		head.insertCell(-1).textContent = 'cid';
		for (var i=0; i<gpsFields.length; i++) head.insertCell(-1).textContent = gpsFields[i];
		
		var body = document.createElement("tbody");
		table.appendChild(body);
	}
	function fillTable(table) {
		var body = table.tBodies[0];
		body.innerHTML = "";
		
		for (var key in data) {
			var lc = key.split(":");
			var lac = lc[0];
			var cid = lc[1];
			var cellMeasures = data[key];
			
			for (var i=0; i<cellMeasures.length; i++) {
				var gps = cellMeasures[i];
				
				var row = body.insertRow(-1);
				row.insertCell(-1).textContent = lac;
				row.insertCell(-1).textContent = cid;
				for (var j=0; j<gpsFields.length; j++) row.insertCell(-1).textContent = gps[gpsFields[j]];
			}
		}
	}
	
	this.add = add;
	this.prepareTable = prepareTable;
	this.fillTable = fillTable;
	this.getData = function(){ return data } //TODO: getter
}

function Harvester(table) {
	var mc = new MeasureContainer();
	mc.prepareTable(table);
	
	var warmup_countdown = 0;
	function gpsWarmup(data) {
		if (!('gps' in data)) return;
		log("Skipping "+warmup_countdown+" more measures (timedelta: "+(Date.now()-data.gps.time)+")");
		warmup_countdown--;
		if (warmup_countdown == 0) {
			core.off('droid-location', gpsWarmup);
			core.on('droid-location', gpsMain);
		}
	}
	
	function gpsMain(data) {
		if (!('gps' in data)) return;
		var gps = data.gps;
		var timedelta = Math.abs(Date.now() - gps.time);
		if (timedelta > 5000) {log("Too large time difference: "+timedelta); return}
		//log([gps.longitude, gps.latitude, gps.accuracy, gps.speed, gps.bearing]);
		var type = droid.getNetworkType().result;
		if (type && type!="unknown") gps.type = type.toUpperCase();
		var res = droid.getCellLocation().result;
		mc.add(res.lac, res.cid, gps);//TODO: here --> [lac, cid] + [gps] --> MeasureContainer --> sendAll() --> emit('oci-send-csv') --> OpenCellId.on('oci-send-csv')
	}
	
	function startCollecting() {
		warmup_countdown = 10;
		droid.startLocating(0, 0);
		core.on('droid-location', gpsWarmup);
	}
	
	function updateTable() {
		mc.fillTable(table);
	}
	
	function sendAll() {
		log("sending all")
		var nop = droid.getNetworkOperator().result;
		var mcc = nop.substr(0, 3);
		var mnc = nop.substr(3);
		var data = mc.getData();
		
		for (var key in data) {
			var lc = key.split(":");
			var lac = lc[0];
			var cid = lc[1];
			var cellMeasures = data[key];
			
			for (var i=0; i<cellMeasures.length; i++) {
				var gps = cellMeasures[i];
				core.emit('oci-measure-add', [
					mcc, mnc, lac, cid,
					gps.longitude, gps.latitude, gps.accuracy,
					gps.speed, gps.bearing, gps.time, gps.type
				]);
			}
		}
	}
	
	this.startCollecting = startCollecting;
	this.updateTable = updateTable;
	this.sendAll = sendAll;
}
