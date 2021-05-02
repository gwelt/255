var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id)
	socket.emit('name','API_RKI');
	socket.emit('join','#API_RKI');
	socket.emit('info','Polling corona-numbers from rki.de and serving them as JSON via private message. Usage: /m #API_RKI [request]');
});

socket.on('message', function(msg,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#API_RKI')) {
	if (/^help|usage$/i.test(msg))  {socket.emit('message','Usage: ...',{rooms:[(meta?meta.sender:undefined)]})};		
	if (/^data|numbers$/i.test(msg)) {socket.emit('message',JSON.stringify(rkidata),{rooms:[(meta?meta.sender:undefined)]})};
  }
});


var rkidata = new RKIDATA();

function RKIDATA() {
	this.array = [];
}

RKIDATA.prototype.update = function(RKI_dataset) {
	this.array = this.array.filter((e)=>{return e.rki_data_status_v.Datum!==RKI_dataset.rki_data_status_v.Datum});
	this.array.push(RKI_dataset);
	while (this.array.length>14) {this.array.shift()};
}

function RKI_dataset(rki_data_status_v) {
	this.rki_data_status_v = rki_data_status_v;
	return this;
}

const URL_rki_data_status_v = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/rki_data_status_v/FeatureServer/0/query?where=Status%3D%27OK%27&objectIds=&time=&resultType=standard&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=standard&f=pjson&token=';
const URL_rki_key_data_hubv = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_hubv/FeatureServer/0/query?where=AdmUnitId%20%3E%3D%200%20AND%20AdmUnitId%20%3C%3D%2099&outFields=AnzFall,AnzTodesfall,AnzFallNeu,AnzTodesfallNeu,AnzFall7T,Inz7T,AdmUnitId&returnGeometry=false&outSR=&f=json';

function getURL(URL,callback) {require('node-fetch')(URL,{method:'get'}).catch(err=>{console.error(err);return}).then(res=>res.text()).then(reply=>{callback(reply)})}

check_RKI_data(); // check RKI-data at startup
setInterval(function(){check_RKI_data()},6*60*60*1000); // and then check RKI-data every 6 hours

function check_RKI_data() {
	let temp_new_RKI_dataset = new RKI_dataset();
	// request data from RKI
	getURL(URL_rki_data_status_v,(reply)=>{
		//console.log('REPLY: '+reply);
		let r=JSON.parse(reply);
		console.log(r.features[0].attributes);
		temp_new_RKI_dataset.rki_data_status_v=r.features[0].attributes;

		// check for updated data
		// add data to local object memory store
		//rkidata.update(new RKI_dataset(r.features[0].attributes));
	});
}
