var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('cam',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say('online')}
  if (/--help/i.test(data)) {say('help: cammove [left|right|up|down] | campreset [pos] | camir [on|off] | camsynctime | camtimestamp [on|off]')}
  //if (/camsnapshot/i.test(data)) {snapshot();say('snapshot saved')}
  if (/cammove\ left/i.test(data)) {move('left');say('cam moved left')}
  if (/cammove\ right/i.test(data)) {move('right');say('cam moved right')}
  if (/cammove\ up/i.test(data)) {move('up');say('cam moved up')}
  if (/cammove\ down/i.test(data)) {move('down');say('cam moved down')}
  if (/campreset\ 1/i.test(data)) {preset(1);say('cam moved to preset 1')}
  if (/campreset\ 2/i.test(data)) {preset(2);say('cam moved to preset 2')}
  if (/campreset\ 3/i.test(data)) {preset(2);say('cam moved to preset 3')}
  if (/camir\ on/i.test(data)) {ir('auto');say('cam ir-mode auto')}
  if (/camir\ off/i.test(data)) {ir('close');say('cam ir-mode off')}
  if (/camsynctime/i.test(data)) {sync_time();say('cam synced time')}
  if (/camtimestamp\ on/i.test(data)) {show_timestamp(1);say('cam timestamp on')}
  if (/camtimestamp\ off/i.test(data)) {show_timestamp(0);say('cam timestamp off')}
}

require('http').createServer(function (req, resp) {
  var ip=req.connection.remoteAddress.replace(/^.*:/, '');
  if (req.url === '/') {resp.write('Hello '+ip+'!');resp.end()}
  //if (req.url === '/') {get_cam_image(resp,0)}
  else if (req.url === '/help') {resp.write('help for cam-interface: cam.jpg | left | right | up | down | preset/[number] | ir/[on|off] | synctime | timestamp/[on|off]');resp.end()}
  else if (/^\/cam/i.test(req.url)) {get_cam_image(resp,ip,0)}
  else if (req.url === '/left') {move('left');get_cam_image(resp,ip,1500)}
  else if (req.url === '/right') {move('right');get_cam_image(resp,ip,1500)}
  else if (req.url === '/up') {move('up');get_cam_image(resp,ip,1500)}
  else if (req.url === '/down') {move('down');get_cam_image(resp,ip,1500)}
  else if (req.url === '/preset/1') {preset(1);get_cam_image(resp,ip,1500)}
  else if (req.url === '/preset/2') {preset(2);get_cam_image(resp,ip,1500)}
  else if (req.url === '/preset/3') {preset(3);get_cam_image(resp,ip,1500)}
  else if (req.url === '/ir/on') {ir('auto');get_cam_image(resp,ip,1500)}
  else if (req.url === '/ir/off') {ir('close');get_cam_image(resp,ip,1500)}
  else if (req.url === '/synctime') {sync_time();get_cam_image(resp,ip,1500)}
  else if (req.url === '/timestamp/on') {show_timestamp(1);get_cam_image(resp,ip,1500)}
  else if (req.url === '/timestamp/off') {show_timestamp(0);get_cam_image(resp,ip,1500)}
  else {resp.end()}
}).listen(8080);

var cam_addr=require('./config.json').cam_addr;

function get_cam_image(resp,ip,timeout) {
  global_say('click '+ip);
  setTimeout(()=>{
    require('request').get('http://'+cam_addr+'/mjpeg/snap.cgi?chn=0', {'auth': {'user': 'admin','pass': '123456','sendImmediately': false}}).pipe(resp)
  },timeout)
}

//move('left');
function move(direction) { 
  require('request').get('http://'+cam_addr+'/hy-cgi/ptz.cgi?cmd=mobileptzctrl&act='+direction, {'headers':{'User-Agent': 'none'}, 'auth': {'user': 'admin','pass': '123456','sendImmediately': false}})
}

//preset(1);
function preset(number) { 
  require('request').get('http://'+cam_addr+'/hy-cgi/ptz.cgi?cmd=preset&act=goto&number='+number, {'headers':{'User-Agent': 'none'}, 'auth': {'user': 'admin','pass': '123456','sendImmediately': false}})
}

//ir('auto');
//ir('close');
function ir(status) { 
  require('request').get('http://'+cam_addr+'/hy-cgi/irctrl.cgi?cmd=setinfrared&infraredstatus='+status, {'headers':{'User-Agent': 'none'}, 'auth': {'user': 'admin','pass': '123456','sendImmediately': false}})
}

function sync_time() {
  Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
  var date=new Date().addHours(2); // 2 = summertime
  var year=date.getFullYear();
  var month=date.getMonth()+1;month=(month<10?"0":"")+month;
  var dayofmonth=date.getDate();dayofmonth=(dayofmonth<10?"0":"")+dayofmonth;
  var hour=date.getHours();hour=(hour<10?"0":"")+hour;
  var min=date.getMinutes();min=(min<10?"0":"")+min;
  var sec=date.getSeconds();sec=(sec<10?"0":"")+sec;
  require('request').get('http://'+cam_addr+'/hy-cgi/device.cgi?cmd=setsystime&stime='+year+'-'+month+'-'+dayofmonth+';'+hour+':'+min+':'+sec+'&timezone=29', {'headers':{'User-Agent': 'none'}, 'auth': {'user': 'admin','pass': '123456','sendImmediately': false}})
}

//show_timestamp(0);
//show_timestamp(1);
function show_timestamp(status) { 
  require('request').get('http://'+cam_addr+'/hy-cgi/av.cgi?cmd=setosdattr&region=0&show='+status, {'headers':{'User-Agent': 'none'}, 'auth': {'user': 'admin','pass': '123456','sendImmediately': false}})
}
