var config = require('./config.json');
const WebSocket = require('ws');
var ws_255 = new WebSocket(config.websocket_url);
ws_255.on('open', function() {setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
ws_255.on('error', function(e) {process.exit()});
ws_255.on('close', function(user) {process.exit()});
var get_or_set=(require('os').networkInterfaces()['wlan0'][0]['address']=="192.168.1.103")?"?set":"?get";

const myname="(publicIP)";

var current_ip="";
check_ip();
setInterval(function(){check_ip()},15*60000);

ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say(current_ip)}
    if (/--help/i.test(data)) {say('help: get public ip')}
    if (/get\ public\ ip/i.test(data)) {check_ip();say('     '+current_ip)}
  }
});

function check_ip() {
  require('http').get({host:config.publicIPserver_url, path:get_or_set}, function(r) {
    var res=""; 
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {if (current_ip!=res) {if (current_ip!="") {say(res)}; current_ip=res;}});
  }).on('error',(e)=>{console.log(get_time()+' '+e+'\nCould not connect to publicIPserver.');setTimeout(function(){process.exit()},60000)})
}

function say(text) {ws_255.send(myname+' '+text)}
