const WebSocket=require('ws');
const myname="(Robot)";
function say(text) {ws_255.send(myname+' '+text)}
ws_255=new WebSocket("ws://"+process.argv[2]);
ws_255.on('open', function opened() {say("Hi. I am a robot.")});
ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (data.includes('Hi')) {say('Hi there.')}
    if (data.includes('time')) {say('The time is '+get_time()+'.')}
  }
});
ws_255.on('error', function(e) {console.log(e+'\nTry this: node this.js [websocket-server]:[port]');process.exit();});

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time() {
  var date=new Date().addHours(1);
  var hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
  return hour+":"+min;
}