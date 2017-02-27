const WebSocket=require('ws');
var ws_255=new WebSocket("ws://"+process.argv[2]);
var publicIPserver=process.argv[3];
var get_or_set=(require('os').networkInterfaces()['wlan0'][0]['address']=="192.168.1.103")?"?set":"?get";

const myname="(publicIP)";
var interval;

var current_ip="";
check_ip();
setInterval(function(){check_ip()},15*60000);

ws_255.on('open', function opened() {
  setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},60000); // send empty message every minute to stay connected, exit if sending fails
});
ws_255.on('error', function(e) {console.log(get_time()+' '+e+'\nTry this: node this.js [websocket-server]:[port] [publicIPserver]');process.exit()});
ws_255.on('close', function(user) {process.exit()});
ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say(current_ip)}
    if (/--help/i.test(data)) {say('help: get public ip')}
    if (/get\ public\ ip/i.test(data)) {check_ip();say('     '+current_ip)}
  }
});

function check_ip() {
  require('http').get({host:publicIPserver, path:get_or_set}, function(r) {
    var res=""; 
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {if (current_ip!=res) {if (current_ip!="") {say(res)}; current_ip=res;}});
  }).on('error',(e)=>{console.log(get_time()+' '+e+'\nCould not connect to publicIPserver.');process.exit()})	
}

function say(text) {ws_255.send(myname+' '+text)}
Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time() {var date=new Date().addHours(1);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+""+min;}
