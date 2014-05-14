var core = {
	handlers: {},
	on: function(name, func) {
		if (name in this.handlers) {
			this.handlers[name].push(func);
		} else {
			this.handlers[name] = [func];
		}
	},
	off: function(name, func) {
		var handlers = this.handlers[name];
		if (!handlers) return false;
		if (func) {
			for (var i=0; i<handlers.length; i++) {
				if (handlers[i] !== func) continue;
				handlers.splice(i, 1);
				return true;
			}
		} else {
			handlers.length = 0;
		}
		return false;
	},
	emit: function(name, args) {
		var handlers = this.handlers[name];
		if (!handlers) return;
		for (var i=0; i<handlers.length; i++) {
			handlers[i].apply(null, args);
		}
	}
};
//droid.startLocating(0, 0);
setInterval(function() {
	var res = droid.eventPoll(128).result;
	if (res.length == 0) return;
	if (res.length > 3) log("Warn: "+res.length+" events in queue: "+res.map(function(x){ return x.name }));
	//logObj(res[0])
	//logObj(res[0].data)
	core.emit('droid-'+res[0].name, [res[0].data]);
}, 250);

utils = {
	USE_FIRST: 0,
	USE_SECOND: 1,
	USE_BOTH: 2,
	whichMeasureToUse: function(lon1, lat1, acc1, lon2, lat2, acc2, lim_dis) {
		var deg_len = 40000000/360; // degree length along meridians
		var lon_deg_len = deg_len * Math.cos(lat1/180*Math.PI); // degree length along parallels
		var d_lon = (lon2-lon1) * lon_deg_len;
		var d_lat = (lat2-lat1) * deg_len;
		var dis_sqr = d_lon*d_lon + d_lat*d_lat; // approximate distance, square
		
		//log("dis: "+dis_sqr+" VS"+(min_move_dis*min_move_dis)+" acc: "+acc1+" VS "+acc2)
		if (dis_sqr > lim_dis*lim_dis) return this.USE_BOTH;
		if (acc2 < acc1) return this.USE_SECOND;
		return this.USE_FIRST;
	},
	disBetween: function(lon1, lat1, lon2, lat2) {
		var deg_len = 40000000/360; // degree length along meridians
		var lon_deg_len = deg_len * Math.cos(lat1/180*Math.PI); // degree length along parallels
		var d_lon = (lon2-lon1) * lon_deg_len;
		var d_lat = (lat2-lat1) * deg_len;
		return Math.sqrt(d_lon*d_lon + d_lat*d_lat);
	}
}
