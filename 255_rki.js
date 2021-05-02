var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id)
	socket.emit('name','rki');
	socket.emit('join','#rki');
	socket.emit('info','Frequently posting corona-numbers from rki.de to #rki. Serving data as JSON via private message on request. Usage: /m #rki [request]');
});

socket.on('message', function(msg,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#rki')) {
	if (/^help|usage$/i.test(msg))  {socket.emit('message','Usage: /m #rki [request], requests: help, HH, Inz7T, JSON',{rooms:[(meta?meta.sender:undefined)]})};		
	if (/^HH$/i.test(msg)) {socket.emit('message',JSON.stringify(rkidata.Inz7T_HH()),{rooms:[(meta?meta.sender:undefined)]})};
	if (/^Inz7T|inz$/i.test(msg)) {socket.emit('message',JSON.stringify(rkidata.Inz7T()),{rooms:[(meta?meta.sender:undefined)]})};
	if (/^JSON|data|numbers$/i.test(msg)) {socket.emit('message',JSON.stringify(rkidata),{rooms:[(meta?meta.sender:undefined)]})};
  }
});


var rkidata = new RKIDATA();
const URL_rki_data_status = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/rki_data_status_v/FeatureServer/0/query?where=Status%3D%27OK%27&objectIds=&time=&resultType=standard&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=standard&f=pjson&token=';
const URL_rki_key_data = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_hubv/FeatureServer/0/query?where=AdmUnitId%20%3E%3D%200%20AND%20AdmUnitId%20%3C%3D%2099&outFields=AnzFall,AnzTodesfall,AnzFallNeu,AnzTodesfallNeu,AnzFall7T,Inz7T,AdmUnitId&returnGeometry=false&outSR=&f=json';
const URL_rki_admunit = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_admunit_v/FeatureServer/0/query?where=AdmUnitId%3C100&objectIds=&time=&resultType=standard&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token="
check_RKI_data(); // check RKI-data at startup
setInterval(function(){check_RKI_data()},3*60*60*1000); // and then check RKI-data every 3 hours
getURL(URL_rki_admunit,(reply)=>{rkidata.rki_admunit=JSON.parse(reply).features});

function getURL(URL,callback) {require('node-fetch')(URL,{method:'get'}).catch(err=>{console.error(err);return}).then(res=>res.text()).then(reply=>{callback(reply)})}

function RKIDATA() {
	this.db = []; // array of RKI_dataset
	this.rki_admunit = undefined;
}

function RKI_dataset(rki_data_status,rki_key_data) {
	this.rki_data_status = rki_data_status;
	this.rki_key_data = rki_key_data;
	return this;
}

RKIDATA.prototype.update = function(RKI_dataset) {
	this.db = this.db.filter((e)=>{return e.rki_data_status.Datum!==RKI_dataset.rki_data_status.Datum});
	this.db.push(RKI_dataset);
	while (this.db.length>14) {this.db.shift()};
}

RKIDATA.prototype.Inz7T = function(RKI_dataset) {
	let today_RKI_dataset=this.db[this.db.length-1];
	let inz7t=today_RKI_dataset.rki_key_data.map((e)=>{return {'Land':this.get_Land_by_AdmUnitId(e.attributes.AdmUnitId),'Inz7T':e.attributes.Inz7T}});
	return {'Inz7T':inz7t,'Datenstand':today_RKI_dataset.rki_data_status.Timestamp_txt};
}

RKIDATA.prototype.Inz7T_HH = function(RKI_dataset) {
	let today_RKI_dataset=this.db[this.db.length-1];
	let inz7t=today_RKI_dataset.rki_key_data.filter((e)=>{return e.attributes.AdmUnitId==2}).map((e)=>{return e.attributes.Inz7T});
	return {'Inz7T_HH':inz7t[0],'Datenstand':today_RKI_dataset.rki_data_status.Timestamp_txt};
}

RKIDATA.prototype.get_Land_by_AdmUnitId = function(AdmUnitId) {
	let f=this.rki_admunit.find((e)=>{return e.attributes.AdmUnitId==AdmUnitId});
	return (f&&f.attributes&&f.attributes.Name)?f.attributes.Name:AdmUnitId;
}

function check_RKI_data() {
	//console.log(new Date().toISOString());
	let new_RKI_dataset = new RKI_dataset();
	// check for updated data
	getURL(URL_rki_data_status,(reply)=>{
		let r=JSON.parse(reply);
		//console.log(r.features[0].attributes);
		new_RKI_dataset.rki_data_status=r.features[0].attributes;
		// if there is new data
		if (!(rkidata.db.some((e)=>{return e.rki_data_status.Datum==new_RKI_dataset.rki_data_status.Datum}))) {
			// request data from RKI
			getURL(URL_rki_key_data,(reply)=>{
				let r=JSON.parse(reply);
				//console.log(r.features);
				new_RKI_dataset.rki_key_data=r.features;
				// add data to local object memory store
				rkidata.update(new_RKI_dataset);
			});
		}
	});
}
