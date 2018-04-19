const webSocket = require('./255_ws_module').startWebsocket('publicIP',(msg,callback)=>messagehandler(msg,callback));
var current_ip="";
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say(current_ip)}
  if (/--help/i.test(data)) {say('help: get public ip')}
  if (/get\ public\ ip/i.test(data)) {say('     '+current_ip)}
  if (/^your\ ip\ is\ \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(data)) {var n=/^your\ ip\ is\ (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i.exec(data); if (n[1]!=current_ip) {current_ip=n[1]; say('     '+current_ip);} }
}
setTimeout(function(){webSocket.send('/getip')},5000);
setInterval(function(){webSocket.send('/getip')},15*60000);
