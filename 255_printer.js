var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);
require('child_process').execSync('stty -F /dev/ttyS0 9600');
ttyS0_print("================================\\nIP: "+require('os').networkInterfaces()['wlan0'][0]['address']+" (wlan0)\\nSOCKET-SERVER: "+config.socket_server_URL+"\\n================================");

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id);
	socket.emit('name','printer');
	socket.emit('join',['#printer'].concat(Array.isArray(config.printer_rooms)?config.printer_rooms:[]));
	socket.emit('info','Messages to #printer will output on this thermal printer. Usage: /m #printer [text]');
});

socket.on('message', function(msg,meta) {
	// special: routing to rki (which replies with a personal message that will then be printed)
	let inz=(/^(Inz7T)(\ )?(.*)?$/i.exec(msg)); if (inz) {socket.emit('message',msg,{rooms:['#rki']}); return};

	if (meta && meta.rooms && !meta.rooms.includes('#printer')) { // do not print timestamp/name on private message >> && meta.rooms.length>0
		if (meta.name) {msg='('+meta.name+') '+msg};
		msg=get_time()+' '+msg;
	}
	ttyS0_print(msg);
});

function ttyS0_print(msg) {
	var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
	msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]}).slice(0,1024);
	//msg=unescape(msg).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'');
	//msg=msg.replace(/\ {2,}/g," ");
	msg=msg.replace(/"/g,'\'');
	require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
}

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(0);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
