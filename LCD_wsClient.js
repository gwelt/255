var WebSocket = require('ws');
var ws = new WebSocket("ws://localhost:3000");
const path = require('path');
var lcd = "";

ws.on('open', function() {
  lcd=require('child_process').fork(path.join(__dirname, 'LCD.js'));
  //lcd.send('LCD-CLIENT      ACTIVE');
});

ws.on('message', function(message) {
  if (message.startsWith(':')) {lcd.send(message.substr(1))}
});
