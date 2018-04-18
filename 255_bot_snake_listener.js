const webSocket = require('./255_ws_module').startWebsocket('SnakeListener',(msg,callback)=>messagehandler(msg,callback));
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say('listening')}
  if (/--help/i.test(data)) {say('help: output-device only')}
}

const WebSocket = require('ws');
var ws_snake=new WebSocket("ws://localhost:3000");
ws_snake.on('open', function() {setInterval(function(){ws_snake.send('',function ack(err){if (err) {process.exit()}})},60000)});
ws_snake.on('message', function incoming(data, flags) {if (!data.startsWith('[') && webSocket.readyState==1) {webSocket.send(data)}});
