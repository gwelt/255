var config = require('./config.json');
const socket = require('socket.io-client')('http://'+config.socket_server+':'+config.socket_server_port||'3000');
require('child_process').execSync('stty -F /dev/ttyS0 9600');
var welcome="===========================\\nIP: "+require('os').networkInterfaces()['wlan0'][0]['address']+" (wlan0)\\nSOCKET-SERVER: "+config.socket_server+':'+config.socket_server_port+"\\n================================";

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id);
	ttyS0_print(welcome);
	socket.emit('name','printer');
	socket.emit('info','Messages to #printer will output on this thermal printer. Usage: /m #printer [text]');
	socket.emit('join','#printer');
});

socket.on('message', function(msg,meta) {
	if (/^--status$/i.test(msg)) {socket.emit('message','listening');}
	if (meta&&meta.rooms&&meta.rooms.includes('#broadcast')) {
		if (meta.name) {msg='('+meta.name+') '+msg};
		msg=get_time()+' '+msg;
	}
	ttyS0_print(msg);
});

function ttyS0_print(msg) {
	var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
	msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
	msg=msg.replace(/\ {2,}/g," ");
	require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
}

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(0);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
