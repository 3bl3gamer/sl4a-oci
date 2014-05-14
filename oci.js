function OpenCellId(key) {
	var progress_cache = {};
	var cache = {};
	
	function cellGet(mcc, mnc, lac, cid) {
		if (lac+":"+cid in progress_cache) return;
		progress_cache[lac+":"+cid] = 0;
		
		var path = "http://www.opencellid.org/cell/get?key="+key+
			"&mcc="+mcc+"&mnc="+mnc+"&lac="+lac+"&cellid="+cid;
		XHR('GET', path, null, function(code, data, xml) {
			log(code+"\n"+data);
			var rsp = xml.getElementsByTagName('rsp')[0];
			
			if (rsp.attributes.getNamedItem('stat').value == "fail") {
				//var err = rsp.getElementsByTagName('err')[0];
				//var code = err.attributes.getNamedItem('code').value;
				cache[lac+":"+cid] = null;
				delete progress_cache[lac+":"+cid];
				core.emit('cell-pos-upd', [lac, cid, lon, lat, cache]);
				return;
			}
			
			var cell = rsp.getElementsByTagName('cell')[0];
			var lon = cell.attributes.getNamedItem('lon').value;
			var lat = cell.attributes.getNamedItem('lat').value;
			
			cache[lac+":"+cid] = [lon, lat];
			delete progress_cache[lac+":"+cid];
			core.emit('oci-cell-pos-upd', [lac, cid, lon, lat, cache]);
		});
	}
	
	function measureAdd(mcc, mnc, lac, cid, lon, lat, rating, speed, dir, time, type) {
		//speed = (+speed+0.5)|0;
		//dir = (+dir+0.5)|0;
		var path = "http://www.opencellid.org/measure/add?key="+key+
			"&mcc="+mcc+"&mnc="+mnc+"&lac="+lac+"&cellid="+cid+
			"&lon="+lon+"&lat="+lat+"&rating="+rating+
			"&speed="+speed+"&direction"+dir;
		if (time) path += "&measured_at="+time;
          if (type) path += "&act="+type;
		log(path);
		XHR('GET', path, null, function(code, data) {
			log(code+"\n"+data);
			//if (code != 200 || data.match(/^Error:/)) return;
		});
	}
	
	function measureUploadCsv(str) {
		// TODO: this
	}
	
	function measureDelete(id) {
		XHR('GET', "http://www.opencellid.org/measure/delete?key="+key+"&id="+id, null, function(code, data) {
			log(code+"\n"+data);
			if (code != 200 || data.match(/^Error:/)) return;
			core.emit('oci-measure-delete', [id]);
		});
	}
	
	function measureList() {
		XHR('GET', "http://www.opencellid.org/measure/list?key="+key, null, function(code, data) {
			data = data.trim().split("\n");
			var labels = data.shift().split(",");
			for (var i=0; i<data.length; i++) data[i] = data[i].split(",");
			core.emit('oci-measure-list', [labels, data]);
		});
	}
	
	this.measureDelete = measureDelete;
	this.measureList = measureList;
	
	core.on('oci-req-cell-pos', cellGet);
	core.on('oci-req-measure-delete', measureDelete);
	core.on('oci-measure-add', measureAdd);
}

