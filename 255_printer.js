var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL,{rejectUnauthorized:false});
//require('child_process').execSync('stty -F /dev/ttyS0 9600');

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id);
	socket.emit('message',socket.id,{rooms:[socket.id]});
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
	//ttyS0.print(msg);
});


/* ttyS0 spooler */
const ttyS0 = new ttyS0_Object();
function ttyS0_Object() {
	this.messages = [];
	this.blocked = false;
	this.exec = require('child_process').exec; //spawn, fork, exec, execSync 
	this.interval = undefined;
	this.delay = 1250;
}
ttyS0_Object.prototype.print = function(msg) {
	var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
	msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]}).slice(0,1024);
	//msg=unescape(msg).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'');
	//msg=msg.replace(/\ {2,}/g," ");
	msg=msg.replace(/"/g,'\'');
	this.messages.push(msg);
	if (!this.interval) {
		this.exec('stty -F /dev/ttyS0 9600',function (error,stdout,stderr) {
			ttyS0.interval = setInterval(()=>{ttyS0.spool()},100);
		});
	};
}
ttyS0_Object.prototype.spool = function() {
	if (!this.messages.length) {clearInterval(this.interval);this.interval=undefined;}
	if (!this.blocked && this.messages.length) {
		this.blocked=true;
		let m=ttyS0.messages.shift();
		ttyS0.exec('echo "'+m+'" > /dev/ttyS0',['-e'],function (error,stdout,stderr) {setTimeout(()=>{ttyS0.blocked=false},ttyS0.delay)});
	}
}
//ttyS0_print("");
ttyS0_print("================================\\nIP: "+require('os').networkInterfaces()['wlan0'][0]['address']+" (wlan0)\\nSOCKET-SERVER: "+config.socket_server_URL+"\\n================================");


function ttyS0_print(msg) {
	var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
	msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]}).slice(0,1024);
	//msg=unescape(msg).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'');
	//msg=msg.replace(/\ {2,}/g," ");
	msg=msg.replace(/"/g,'\'');
	require('child_process').execSync('stty -F /dev/ttyS0 9600');
	require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
}

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(0);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
