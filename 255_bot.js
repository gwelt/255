var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('Robot',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
function messagehandler(data,say) {
  if (/--help/i.test(data)) {say('help: Hi | time | fortune | ping | ping off')}
  if (/--status/i.test(data)) {say('at your service')}
  if ((data.match(/\Whi\W/i))||(data.match(/^hi$/i))) {say('Hi there.')}	
  if (data.includes('time')) {say('The time is '+get_time(1)+'.')}
  if (data.includes('fortune')) {say(require('child_process').execSync('fortune',{stdio:'pipe'}).toString().replace(/[\r\n]/g,' '))}
  if (/ping$/i.test(data)) {say('PONG');clearInterval(interval);interval=setInterval(function(){say("I'm alive! "+get_time())},30*60000)}
  if (/ping\ off$/i.test(data)) {say('Interval cleared.');clearInterval(interval)}
}

var interval;
Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(2);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
