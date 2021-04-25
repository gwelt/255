var config = require('./config.json');
const socket = require('socket.io-client')('http://'+config.socket_server+':'+config.socket_server_port||'3000');
var global_say=()=>{};
var current_ip="";

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','publicIP');
  socket.emit('info','Updating public IP every 15 minutes. Usage: get_public_ip');
  global_say=(m)=>{socket.emit('message',m)};
});

socket.on('message', function(msg,meta) {
  if (/--status/i.test(msg)) {global_say(current_ip)}
  if (/--help/i.test(msg)) {global_say('help: get_public_ip')}
  if (/get\_public\_ip/i.test(msg)) {global_say(current_ip)}
});

setTimeout(function(){check_ip()},5000);
setInterval(function(){check_ip()},15*60000);

function check_ip() {
  require('http').get({host:config.socket_server, port:config.socket_server_port, path:'/255/api/setpublicip'}, function(r) {
    var res=""; 
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {if (current_ip!=res) {current_ip=res; global_say(current_ip)} });
  }).on('error',(e)=>{setTimeout(function(){process.exit()},60000)})
}