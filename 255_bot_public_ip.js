const webSocket = require('./255_ws_module').startWebsocket('publicIP',(msg,callback)=>messagehandler(msg,callback));
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say(current_ip)}
  if (/--help/i.test(data)) {say('help: get public ip')}
  if (/get\ public\ ip/i.test(data)) {check_ip();say('     '+current_ip)}
}

var config = require('./config.json');
var get_or_set="?set";
//get_or_set=(require('os').networkInterfaces()['wlan0'][0]['address']=="192.168.1.103")?"?set":"?get";
var current_ip="";
check_ip();
setInterval(function(){check_ip()},15*60000);

function check_ip() {
  require('http').get({host:config.publicIPserver_url, path:get_or_set}, function(r) {
    var res=""; 
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {if (current_ip!=res) {if (current_ip!="") {}; current_ip=res;}});
  }).on('error',(e)=>{setTimeout(function(){process.exit()},60000)})
}
