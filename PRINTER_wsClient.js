const websocketserver="localhost:3000";
const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";

var WebSocket = require('ws');
var ws = new WebSocket("ws://"+websocketserver);

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}

ws.on('open', function() {
  p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  var welcome="================================\\nInterface: "+interface+"\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+"\\nPrinter: "+printer+" @"+baudrate+" baud\\nListening @"+websocketserver+"\\n================================";
  p.execSync('echo "'+welcome+'" > '+printer,'e');
  //console.log(welcome);
});

ws.on('message', function(message) {
  if (message.startsWith(':')) {
    var date=new Date().addHours(1);
    var hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
  	require('child_process').execSync('echo "'+hour+""+min+' '+message.substr(1)+'" > /dev/ttyS0','e');
  	//console.log(message.substr(1));
  }
});
