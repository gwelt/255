var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('publicIP',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
var config = require('./config.json');
var current_ip="";
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say(current_ip)}
  if (/--help/i.test(data)) {say('help: get public ip')}
  if (/get\ public\ ip/i.test(data)) {say('     '+current_ip)}
}
setTimeout(function(){check_ip()},5000);
setInterval(function(){check_ip()},15*60000);

function check_ip() {
  require('http').get({host:config.socket_server, port:config.socket_server_port, path:'/255/api/setpublicip'}, function(r) {
    var res=""; 
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {if (current_ip!=res) {current_ip=res; global_say('     '+current_ip)} });
  }).on('error',(e)=>{setTimeout(function(){process.exit()},60000)})
}