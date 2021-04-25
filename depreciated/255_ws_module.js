var config = require('./config.json');
exports.startWebsocket = function (myname,messagehandler) {
  const WebSocket = require('ws');
  WebSocket.prototype.say = function(text) {
    try { this.send('('+myname+') '+text) } catch (e) {}
  }
  var ws = new WebSocket(config.websocket_url);
  ws.on('open', function() {setInterval(function(){ws.send('',function ack(err){if (err) { process.exit() }})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
  ws.on('error', function(e) {setTimeout(function(){ process.exit(); },60000) });
  ws.on('close', function(user) {process.exit()});
  ws.on('message', function incoming(data, flags) {
    if (!data.startsWith('('+myname+')')) {
      messagehandler(data,(reply)=>{ws.say(reply)})
    }
  });
  return ws;
};
