var config = require('./config.json');
const WebSocket = require('ws');
var ws_255_connected=false;
var ws_255 = new WebSocket(config.websocket_url);
ws_255.on('open', function() {ws_255_connected=true;setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
ws_255.on('error', function(e) {process.exit()});
ws_255.on('close', function(user) {process.exit()});

const myname="(SnakeListener)";

ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('listening')}
    if (/--help/i.test(data)) {say('help: output-device only')}
  }
});

function say(text) {ws_255.send(myname+' '+text)}
var ws_snake=new WebSocket("ws://localhost:3000");
ws_snake.on('open', function() {setInterval(function(){ws_snake.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)});
ws_snake.on('message', function incoming(data, flags) {if (!data.startsWith('[') && ws_255_connected) {ws_255.send(data)}});
