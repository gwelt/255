var config = require('./config.json');
const WebSocket = require('ws');
var ws_255 = new WebSocket(config.websocket_url);
ws_255.on('open', function() {setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
ws_255.on('error', function(e) {process.exit()});
ws_255.on('close', function(user) {process.exit()});

const myname="(Robot)";

var interval;
ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('at your service')}
    if (/--help/i.test(data)) {say('help: Hi | time | fortune | ping | ping off')}
    if ((data.match(/\Whi\W/i))||(data.match(/^hi$/i))) {say('Hi there.')}
    if (data.includes('time')) {say('The time is '+get_time(1)+'.')}
    if (data.includes('fortune')) {say(require('child_process').execSync('fortune',{stdio:'pipe'}).toString().replace(/[\r\n]/g,' '))}
    if (/ping$/i.test(data)) {say('PONG');clearInterval(interval);interval=setInterval(function(){say("I'm alive! "+get_time())},30*60000)}
    if (/ping\ off$/i.test(data)) {say('Interval cleared.');clearInterval(interval)}
  }
});

function say(text) {ws_255.send(myname+' '+text)}
Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(2);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
