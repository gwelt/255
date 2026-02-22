var ws281x = require('./node_modules/rpi-ws281x-native/lib/ws281x-native');
const LEDbar = require('//var/www/html/led.js'); // require('./led.js');
var ledBar = new LEDbar(ws281x);

var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL,{rejectUnauthorized:false});

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','led');
  socket.emit('join',['#led'].concat(Array.isArray(config.led_rooms)?config.led_rooms:[]));
  socket.emit('info','LED magic. Usage: #led [#color]|? (e.g. #led #00ff00) | fade ([#color]) | rainbow ([steps]) ([delay_ms]) | sparkle ([seconds]) ([sparks_per_second]) ([spark_avg_duration_ms]) | party ([seconds]) | info ([#color]) | defaultaction [name]');
  ledBar.show_info();
  ledBar.show_info_animation('#00ff00',5);
});

socket.on("disconnect", (reason) => {
  ledBar.show_info('#ff0000');
  ledBar.show_info_animation('#ff0000',30);
});

ledBar.socket_on_message(socket,(t,m,r)=>{socket.emit(t,m,r)}); // included in led.js
