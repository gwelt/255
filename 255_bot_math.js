var config = require('./config.json');
const WebSocket = require('ws');
var ws_255 = new WebSocket(config.websocket_url);
ws_255.on('open', function() {setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
ws_255.on('error', function(e) {process.exit()});
ws_255.on('close', function(user) {process.exit()});

const myname="(Mathbot)";

ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('at your service')}
    if (/--help/i.test(data)) {say('help: fib [1-999]')}
    var d=(/^fib\ ?(\d{1,3})$/i.exec(data)); if (d) {say('fib('+d[1]+')='+fib(d[1]))};
  }
});

function fib(n) {var r=0, a=0, b=1; for(var i=0;i<n;i++) {r=a+b; if (i>0) {a=b}; b=r;} return r}
function say(text) {ws_255.send(myname+' '+text)}
