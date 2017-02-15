const WebSocket=require('ws');
var ws_255=new WebSocket("ws://"+process.argv[2]);

const myname="(SnakeListener)";
var ws_255_connected=false;

ws_255.on('open', function opened() {
  ws_255_connected=true;
  setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},60000); // send empty message every minute to stay connected, exit if sending fails
});
ws_255.on('error', function(e) {console.log(e+'\nTry this: node this.js [websocket-server]:[port]');process.exit()});
ws_255.on('close', function(user) {process.exit()});
ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('status: listening')}
    if (/--help/i.test(data)) {say('help: output-device only')}
  }
});

function say(text) {ws_255.send(myname+' '+text)}
var ws_snake=new WebSocket("ws://localhost:3000");
ws_snake.on('message', function incoming(data, flags) {if (!data.startsWith('[') && ws_255_connected) {ws_255.send(data)}});
