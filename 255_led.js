var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','led');
  socket.emit('join',['#led','#broadcast','#twitter','#printer']);
  socket.emit('info','LED showing the requested colour. Example: /m #led #ff00ff');
});

socket.on('message', function(msg,meta) {
  let c=(/^#([0-9a-f]{6})$/i.exec(msg)); if (c) {
    current_color=c[1];
    socket.emit('message','Ok. Colour is #'+current_color+' now.',{rooms:[(meta?meta.sender:undefined)]});
  } else {
    if (meta&&meta.rooms&&meta.rooms.includes('#led')) {
      current_color=randCol();
      socket.emit('message','Ok. How do you like #'+current_color+'?',{rooms:[(meta?meta.sender:undefined)]});
    };
  }
  socket.emit('info','LED showing the requested colour. Currently showing beautiful #'+current_color+'. Example: /m #led #ff00ff');
  blinkLED();
});

var Gpio = require('onoff').Gpio;
var LED = new Gpio(17, 'out');
var ws281x = require('./node_modules/rpi-ws281x-native/lib/ws281x-native');
var NUM_LEDS = parseInt(process.argv[2], 10) || config.NUM_LEDS || 16,
    pixelData = new Uint32Array(NUM_LEDS);
ws281x.init(NUM_LEDS);
process.on('SIGINT', function () {ws281x.reset(); process.nextTick(function () { process.exit(0); });});

var current_color='50c050';
set_color(current_color,NUM_LEDS);

function rgb2Int(r, g, b) {return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff)}
function hex2Int(hex) {var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? rgb2Int(parseInt(result[1],16),parseInt(result[2],16),parseInt(result[3],16)) : null;}
function randCol() {var c='0123456789ABCDEF'; var r=''; for (var i=0;i<6;i++) {r+=c[Math.floor(Math.random()*16)];} return r;}

function set_color(colorcode,length) {
  for(var i = 1; i <= NUM_LEDS; i++) {
    pixelData[NUM_LEDS-i] = pixelData[NUM_LEDS-i-length] || hex2Int(colorcode);
  }
  ws281x.render(pixelData);
}

var animation;
function push_color_array(color_array,delay) {
  clearInterval(animation);
  var counter=0;
  animation = setInterval(function(){
    if (counter<color_array.length+NUM_LEDS) {
      set_color(color_array[counter]||current_color,1);
    } else {
      clearInterval(animation);
    }
    counter++;
  },delay);
}

function blinkLED() {
    push_color_array(['303030',,'808080',,'303030'],50);
    LED.writeSync(1);
    setTimeout(()=>{LED.writeSync(0)}, 320);
}
