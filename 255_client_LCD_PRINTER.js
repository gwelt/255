const WebSocket=require('ws');
var ws_255=new WebSocket("ws://"+process.argv[2]);

const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";
const path = require('path');
var lcd = "";

ws_255.on('open', function() {
  lcd=require('child_process').fork(path.join(__dirname, 'LCD.js'));
  p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nPrinter: "+printer+" @"+baudrate+" baud\\nListening @"+process.argv[2]+"\\n================================";
  p.execSync('echo "'+welcome+'" > '+printer,'e');
  setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},60000); // send empty message every minute to stay connected, exit if sending fails
});
ws_255.on('error', function(e) {console.log(get_time()+' '+e+'\nTry this: node this.js [websocket-server]:[port]');process.exit()});
ws_255.on('close', function(user) {process.exit()});
ws_255.on('message', function(msg) {message(msg)});

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time() {
  var date=new Date().addHours(1);
  var hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
  return hour+""+min;
}
function message(msg) {
  if (!msg.startsWith('[')) {
    var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
    msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
    lcd.send(msg);
    msg=get_time()+" "+msg;
    require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
  }
}