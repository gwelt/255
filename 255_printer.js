var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('PRINTER',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
function messagehandler(data,no_say) {
  message(data);
  if (/--status/i.test(data)) {say('online')}
}

function say(msg) {
  global_say(msg);
  message('(PRINTER) '+msg);
}

var config = require('./config.json');
const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";

p=require('child_process');
p.execSync('stty -F '+printer+' '+baudrate);
var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nSOCKET-SERVER: "+config.socket_server+':'+config.socket_server_port+"\\n================================"; //\\nPrinter: "+printer+" @"+baudrate+" baud
p.execSync('echo "'+welcome+'" > '+printer,'e');

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
//winter: addHours(1), summer: addHours(2)
function get_time(long) {var date=new Date().addHours(0);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}

function message(msg) {
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
  msg=msg.replace(/\ {2,}/g," ");
  msg=get_time()+" "+msg;
  require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
}
