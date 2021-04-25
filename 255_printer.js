var config = require('./config.json');
const socket = require('socket.io-client')('http://'+config.socket_server+':'+config.socket_server_port||'3000');

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id)
	socket.emit('name','printer');
	socket.emit('info','messages to #printer will output on this thermal printer (e.g. /m #printer text)');
	socket.emit('join','#printer');
});

socket.on('message', function(msg,meta) {
	if (/--status/i.test(msg)) {socket.emit('message','at your service')}
	if (/--help/i.test(msg)) {socket.emit('message','help: send to #printer to print on this thermal printer (e.g. /m #printer text)')}
	message(msg);
});

const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";

p=require('child_process');
p.execSync('stty -F '+printer+' '+baudrate);
var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nSOCKET-SERVER: "+config.socket_server+':'+config.socket_server_port+"\\n================================"; //\\nPrinter: "+printer+" @"+baudrate+" baud
p.execSync('echo "'+welcome+'" > '+printer,'e');

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
//winter: addHours(1), summer: addHours(2)
function get_time(long) {var date=new Date().addHours(0);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}

function message(msg) {
	var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
	msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
	msg=msg.replace(/\ {2,}/g," ");
	msg=get_time()+" "+msg;
	require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
}
