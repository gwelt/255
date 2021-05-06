var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id)
	socket.emit('name','rki');
	socket.emit('join','#rki');
	socket.emit('info','Frequently posting corona-numbers from rki.de to #broadcast. Serving data on request. Usage: /m #rki help');
});

socket.on('message', function(msg,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#rki')) {
	if (/^help|usage$/i.test(msg)) {socket.emit('message','Usage examples: /m #rki Inz7T Hamburg, /m #rki Inz7T, /m #rki i Bremen, /m #rki JSON',{rooms:[(meta?meta.sender:undefined)]})};		
	let inz=(/^(Inz7T|Inzidenz|inz|i)(\ )?(.*)$/i.exec(msg)); if (inz) {
		if ((inz[2])&&(inz[3])) {
			if (inz[1]=='i') {
				socket.emit('message',rki.Inz7T(inz[3]),{rooms:[(meta?meta.sender:undefined)]});
			} else {
				socket.emit('message','Inzidenzwert '+(rki.get_Land_by_AdmUnitId(inz[3])||inz[3])+': '+rki.Inz7T(inz[3])+' ('+rki.Inz7T_diff_prev_day(inz[3])+')'+'\n'+bigNumber(rki.Inz7T(inz[3]),2)+'\n',{rooms:[(meta?meta.sender:undefined)]});
				setTrafficlightColor(rki.Inz7T(inz[3]));
			}
		} else {
			let formatted_output = rki.Inz7T().Inz7T.reduce((a,c)=>{return a+c.Land.substr(0,18).padEnd(18)+' '+c.Inz7T+' ('+c.diff+')\n'},'Inzidenzen Deutschland:\n');
			socket.emit('message',formatted_output,{rooms:[(meta?meta.sender:undefined)]});
			//socket.emit('message',JSON.stringify(rki.Inz7T()),{rooms:[(meta?meta.sender:undefined)]});
		}
	};
	if (/^JSON|data|numbers$/i.test(msg)) {socket.emit('message',JSON.stringify(rki),{rooms:[(meta?meta.sender:undefined)]})};
  }
});

function RKIDATA() {
	this.db = []; // array of RKI_dataset
	this.rki_admunit = undefined;
	this.URL_rki_data_status = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/rki_data_status_v/FeatureServer/0/query?where=Status%3D%27OK%27&objectIds=&time=&resultType=standard&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=standard&f=pjson&token=';
	this.URL_rki_key_data = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_hubv/FeatureServer/0/query?where=AdmUnitId%20%3E%3D%200%20AND%20AdmUnitId%20%3C%3D%2099&outFields=AnzFall,AnzTodesfall,AnzFallNeu,AnzTodesfallNeu,AnzFall7T,Inz7T,AdmUnitId&returnGeometry=false&outSR=&f=json';
	this.URL_rki_admunit = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_admunit_v/FeatureServer/0/query?where=AdmUnitId%3C100&objectIds=&time=&resultType=standard&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token="
	return this;
}

function RKI_dataset(rki_data_status,rki_key_data) {
	this.rki_data_status = rki_data_status;
	this.rki_key_data = rki_key_data;
	return this;
}

RKIDATA.prototype.get_rki_admunit = function() {
	getObjbyURL(this.URL_rki_admunit,(r)=>{this.rki_admunit=r.features});
}

RKIDATA.prototype.check = function() {
	let new_RKI_dataset = new RKI_dataset();
	// check for updated data
	getObjbyURL(this.URL_rki_data_status,(r)=>{
		new_RKI_dataset.rki_data_status=r.features[0].attributes;
		// if there is new data
		if (!(this.db.some((e)=>{return e.rki_data_status.Datum==new_RKI_dataset.rki_data_status.Datum}))) {
			// request data from RKI
			getObjbyURL(this.URL_rki_key_data,(r)=>{
				new_RKI_dataset.rki_key_data=r.features;
				// add data to local object memory store
				this.update(new_RKI_dataset);
			});
		}
	});
}

RKIDATA.prototype.update = function(RKI_dataset) {
	this.db = this.db.filter((e)=>{return e.rki_data_status.Datum!==RKI_dataset.rki_data_status.Datum});
	this.db.push(RKI_dataset);
	socket.emit('message','Inzidenzwert '+this.get_Land_by_AdmUnitId(2)+': '+this.Inz7T(2)+' ('+this.Inz7T_diff_prev_day(2)+')'+'\n'+bigNumber(this.Inz7T(2))+'\n',{rooms:['#broadcast']})
	while (this.db.length>7) {this.db.shift()};
}

RKIDATA.prototype.Inz7T = function(AdmUnitId_or_LandName,days_back_in_history) {
	if (days_back_in_history>=this.db.length) {return undefined};
	let selected_RKI_dataset=this.db[this.db.length-1-(days_back_in_history||0)];
	if (AdmUnitId_or_LandName!==undefined) {
		return selected_RKI_dataset.rki_key_data.filter((e)=>{return e.attributes.AdmUnitId==this.get_AdminUnitId_by_LandName(AdmUnitId_or_LandName)}).map((e)=>{return e.attributes.Inz7T})[0];
	} else {
		let inz7t=selected_RKI_dataset.rki_key_data.map((e)=>{return {'Land':this.get_Land_by_AdmUnitId(e.attributes.AdmUnitId),'Inz7T':e.attributes.Inz7T,'diff':this.Inz7T_diff_prev_day(e.attributes.AdmUnitId)}});
		return {'Inz7T':inz7t,'Datenstand':selected_RKI_dataset.rki_data_status.Timestamp_txt};
	}
}

RKIDATA.prototype.Inz7T_diff_prev_day = function(AdmUnitId_or_LandName) {
	if (AdmUnitId_or_LandName!==undefined) {
		let yesterday = this.Inz7T(AdmUnitId_or_LandName,1);
		let today = this.Inz7T(AdmUnitId_or_LandName)||0;
		let res=Math.round((today-(yesterday?yesterday:today))*10)/10;
		return ((res>=0)?'+':'')+res;
	} else {return undefined}
}

RKIDATA.prototype.get_Land_by_AdmUnitId = function(AdmUnitId) {
	let f=this.rki_admunit.find((e)=>{return e.attributes.AdmUnitId==AdmUnitId});
	return (f&&f.attributes&&f.attributes.Name)?f.attributes.Name:AdmUnitId;
}

RKIDATA.prototype.get_AdminUnitId_by_LandName = function(LandName) {
	let f=this.rki_admunit.find((e)=>{return e.attributes.Name==LandName});
	return (f&&f.attributes&&(f.attributes.AdmUnitId!==undefined))?f.attributes.AdmUnitId:LandName;
}

function getObjbyURL(URL,callback) {require('node-fetch')(URL,{method:'get'}).catch(err=>{console.error(err);return}).then(res=>res.text()).then(reply=>{callback(JSON.parse(reply))})}

var rki = new RKIDATA();
rki.get_rki_admunit();
rki.check(); // check RKI-data on startup
setInterval(function(){rki.check()},3*60*60*1000); // and then check RKI-data every 3 hours


// =====================================================================
function setTrafficlightColor(val) {
	//console.log((val>100)?'#ff0000':((val>35)?'#ffff00':'#00ff00'));
} 
// =====================================================================


function bigNumber(i,space,width,delimiter) {
let bn=`
 0000
00  00
00  00
00  00
 0000

1111
  11
  11
  11
111111

 2222
22  22
   22
  22
222222

 3333
33  33
   333
33  33
 3333

44  44
44  44
444444
    44
    44

555555
55
55555
    55
55555

 6666
66
66666
66  66
 6666

777777
   77
  77
 77
77

 8888
88  88
 8888
88  88
 8888

 9999
99  99
 99999
    99
 9999
`.split('\n');
  space=space||2;width=width||32;delimiter=delimiter||'\n';let a=Math.round(i).toString().split('');let w=Math.max(...bn.map(n=>n.length));let r='';
  for (let y=0;y<5;y++) {r+=''.padEnd((width-(a.length*(w+space)-space))/2);a.forEach((n)=>{if (bn[n*6+y+1]) {r+=bn[n*6+y+1].padEnd(w+space)}});if (y<4) {r+=delimiter}} return r;
}
//console.log(bigNumber(190.6));
