const Configuration = require('./255_conf.js');
var config = new Configuration();
const WebSocket = require('ws');
var ws_255 = new WebSocket(config.websocket_url);
//ws_255.on('open', function() {setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
ws_255.on('error', function(e) {process.exit()});
ws_255.on('close', function(user) {process.exit()});

const myname="(BOX)";
const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";
const path = require('path');
var lcd = "";
var printer_is='AN';
var light_is='?';

ws_255.on('open', function() {
  lcd=require('child_process').fork(path.join(__dirname, 'LCD.js'));
  lcd.send('READY.');
  p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nListening @"+process.argv[2]+"\\n================================"; //\\nPrinter: "+printer+" @"+baudrate+" baud
  p.execSync('echo "'+welcome+'" > '+printer,'e');
  setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay); // send empty message to stay connected, exit if sending fails
});
ws_255.on('error', function(e) {console.log(get_time()+' '+e+'\nTry this: node this.js [websocket-server]:[port]');process.exit()});
ws_255.on('close', function(user) {process.exit()});
ws_255.on('message', function incoming(data, flags) {
  message(data);
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('DRUCKER:'+printer_is+' LICHT:'+light_is)}
    if (/--help/i.test(data)) {say('help: drucker an/aus | licht an/aus | bssid | essid')}
    if (/drucker\ an/i.test(data)) {printer_is='AN';say('          DRUCKER AN '+get_time(1))}
    if (/drucker\ aus/i.test(data)) {printer_is='AUS';say('          DRUCKER AUS'+get_time(1))}
    if (/licht\ an/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -t');say('          LICHT AN   '+get_time(1));light_is="AN"}
    if (/licht\ aus/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -f');say('          LICHT AUS  '+get_time(1));light_is="AUS"}
    if (/bssid/i.test(data)) {say(require('child_process').execSync('iwlist wlan0 scanning | grep -o ..:..:..:..:..:..',{stdio:'pipe'}).toString().replace(/[\r\n]/g,' '))}
    if (/essid/i.test(data)) {say(require('child_process').execSync("iwlist wlan0 scanning | grep ESSID",{stdio:'pipe'}).toString().replace(/\ /g,''))}
  }
});

function say(text) {ws_255.send(myname+' '+text)}
Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(1);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
function message(msg) {
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
  lcd.send(msg);
  if (printer_is!='AUS') {
    msg=msg.replace(/\ {2,}/g," ");
    msg=get_time()+" "+msg;
    require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');      
  }
}
