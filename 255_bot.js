const WebSocket=require('ws');
var ws_255=new WebSocket("ws://"+process.argv[2]);

const myname="(Robot)";
var interval;

ws_255.on('open', function opened() {say("Hi. I am a robot.")});
ws_255.on('error', function(e) {console.log(get_time()+' '+e+'\nTry this: node this.js [websocket-server]:[port]');process.exit()});
ws_255.on('close', function(user) {process.exit()});
ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (data.startsWith('Hi')) {say('Hi there.')}
    if (data.includes('time')) {say('The time is '+get_time()+'.')}
    if (data.includes('fortune')) {say(require('child_process').execSync('fortune',{stdio:'pipe'}).toString().replace(/[\r\n]/g,' '))}
    if (data=='PING') {say('PONG');clearInterval(interval);interval=setInterval(function(){say("I'm alive! "+get_time())},10*60000)}
    if (data=='PING OFF') {say('Interval cleared.');clearInterval(interval)}
  }
});

function say(text) {ws_255.send(myname+' '+text)}
Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time() {
  var date=new Date().addHours(1);
  var hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
  return hour+":"+min;
}