const WebSocket = require('ws');

ws_255=new WebSocket("ws://"+process.argv[2]);
var ws_255_connected=false;
ws_255.on('open', function opened() {ws_255_connected=true});
ws_255.on('error', function(e) {console.log(e+'\nTry this: node this.js [websocket-server]:[port]');process.exit();});

ws_snake=new WebSocket("ws://localhost:3000");
ws_snake.on('message', function incoming(data, flags) {if (!data.startsWith('[') && ws_255_connected) {ws_255.send(data)}});
