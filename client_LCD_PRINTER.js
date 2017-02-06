var websocketserver="localhost"; //localhost:3000
if (process.argv[2]) {websocketserver=process.argv[2]};
const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";
const path = require('path');
var lcd = "";

var WebSocket = require('ws');
var ws = new WebSocket("ws://"+websocketserver);

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time() {
  var date=new Date().addHours(1);
  var hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
  return hour+""+min;
}
function message(msg) {
  lcd.send(msg);
  msg=get_time()+" "+msg;
  require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
}

ws.on('open', function() {
  console.log('CONNECTED TO ws://'+websocketserver);
  lcd=require('child_process').fork(path.join(__dirname, 'LCD.js'));
  p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  var welcome="================================\\nInterface: "+interface+"\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+"\\nPrinter: "+printer+" @"+baudrate+" baud\\nListening @"+websocketserver+"\\n================================";
  p.execSync('echo "'+welcome+'" > '+printer,'e');
});

ws.on('message', function(msg) {message(msg);});
ws.on('close', function(e) {message('CONNECTION CLOSED '+e);process.exit();});
ws.on('error', function(e) {console.log(e+'\nTry this: node this.js [websocket-server]:[port]');process.exit();});
