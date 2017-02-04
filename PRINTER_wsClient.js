var WebSocket = require('ws');
var ws = new WebSocket("ws://localhost:3000");
require('child_process').execSync('stty -F /dev/ttyS0 9600');

var welcome="================================\\nhttp://"+require('os').networkInterfaces()['wlan0'][0]['address']+":3000\\n================================";
require('child_process').execSync('echo "'+welcome+'" > /dev/ttyS0','e');
console.log(welcome);

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}

ws.on('message', function(message) {
  if (message.startsWith(':')) {
        var date=new Date().addHours(1);
        var hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
        var min  = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
  	require('child_process').execSync('echo "'+hour+""+min+' '+message.substr(1)+'" > /dev/ttyS0','e');
  	//console.log(message.substr(1));
  }
});
