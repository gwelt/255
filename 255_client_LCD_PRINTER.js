const WebSocket=require('ws');
var ws_255=new WebSocket("ws://"+process.argv[2]);

const myname="(LCD_PRINTER)";
const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";
const path = require('path');
var lcd = "";
var printer_is='ON';
var light_is='?';

ws_255.on('open', function() {
  lcd=require('child_process').fork(path.join(__dirname, 'LCD.js'));
  lcd.send('READY.');
  p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nListening @"+process.argv[2]+"\\n================================"; //\\nPrinter: "+printer+" @"+baudrate+" baud
  p.execSync('echo "'+welcome+'" > '+printer,'e');
  setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},60000); // send empty message every minute to stay connected, exit if sending fails
});
ws_255.on('error', function(e) {console.log(get_time()+' '+e+'\nTry this: node this.js [websocket-server]:[port]');process.exit()});
ws_255.on('close', function(user) {process.exit()});
ws_255.on('message', function incoming(data, flags) {
  message(data);
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('P:'+printer_is+' L:'+light_is)}
    if (/--help/i.test(data)) {say('help: printer on/off | light on/off')}
    if (/printer\ off/i.test(data)) {say('printer is OFF');printer_is='OFF'}
    if (/printer\ on/i.test(data)) {say('printer is ON');printer_is='ON'}
    if (/light\ on/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -t');say('light is ON');light_is="ON"}
    if (/light\ off/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -f');say('light is OFF');light_is="OFF"}
  }
});

function say(text) {ws_255.send(myname+' '+text)}
Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time() {var date=new Date().addHours(1);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+""+min;}
function message(msg) {
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
  lcd.send(msg);
  if (printer_is=='ON') {
    msg=msg.replace(/\ {2,}/g," ");
    msg=get_time()+" "+msg;
    require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');      
  }
}