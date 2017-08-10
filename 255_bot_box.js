const webSocket = require('./255_ws_module').startWebsocket('BOX',(msg,callback)=>messagehandler(msg,callback));
function messagehandler(data,no_say) {
  message(data);
  if (/--status/i.test(data)) {say('DRUCKER:'+printer_is+' LICHT:'+light_is+' BEEP:'+beep_is)}
  if (/--help/i.test(data)) {say('help: drucker an/aus | licht an/aus | bssid | essid | beep [count] | beep an/aus | shplst [id]')}
  if (/drucker\ an/i.test(data)) {printer_is='AN';say('          DRUCKER AN '+get_time(1))}
  if (/drucker\ aus/i.test(data)) {printer_is='AUS';say('          DRUCKER AUS'+get_time(1))}
  if (/licht\ an/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -t');say('          LICHT AN   '+get_time(1));light_is="AN"}
  if (/licht\ aus/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -f');say('          LICHT AUS  '+get_time(1));light_is="AUS"}
  if (/bssid/i.test(data)) {say(require('child_process').execSync('iwlist wlan0 scanning | grep -o ..:..:..:..:..:..',{stdio:'pipe'}).toString().replace(/[\r\n]/g,' '))}
  if (/essid/i.test(data)) {say(require('child_process').execSync("iwlist wlan0 scanning | grep ESSID",{stdio:'pipe'}).toString().replace(/\ /g,''))}
  let b=(/beep\ (\d)$/i.exec(data)); if (b) {if (beep_is!='AUS') {beep(b[1],20,100)}};
  if (/beep\ an/i.test(data)) {beep_is='AN';  say('           BEEP AN   '+get_time(1))}
  if (/beep\ aus/i.test(data)) {beep_is='AUS';say('           BEEP AUS  '+get_time(1))}
  let shplst=(/shplst\ ([^\ ]*)$/i.exec(data)); if (shplst) {say('PRINTING SHOPPINGLIST');get_shplst('shp.gwelt.net',shplst[1],'LIDL',send_to_printer)}
  if (/sudoku/i.test(data)) {
    say('PRINTING SUDOKU');
    var puzzle=require('../sudoku/sudoku_generator.js').generate();
    var s=require('../sudoku/sudoku_solver.js').solve(puzzle[0]);
    var hints=puzzle[0].split('').map((c)=>{return c=='-'?0:1}).reduce((l,r)=>{return l+r},0);
    send_to_printer('\nPUZZLE:\n'+print_2d(puzzle[0])+'\n\nSOLUTION:\n'+print_2d(puzzle[1])+'\nRATING: '+s.stats.dig_needed+'.'+hints+'\n\n');
  }


}

function say(msg) {
  webSocket.say(msg);
  message('(BOX) '+msg);
}

var config = require('./config.json');
const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";
const path = require('path');
var lcd = "";
var printer_is='AN';
var beep_is='AN';
var light_is='?';

lcd=require('child_process').fork(path.join(__dirname, 'LCD.js'));
lcd.send('READY.');
p=require('child_process');
p.execSync('stty -F '+printer+' '+baudrate);
var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nConnect @"+config.websocket_url+"\\n================================"; //\\nPrinter: "+printer+" @"+baudrate+" baud
p.execSync('echo "'+welcome+'" > '+printer,'e');

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
function get_time(long) {var date=new Date().addHours(2);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
function message(msg) {
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
  lcd.send(msg);
  if (beep_is!='AUS') {one_beep()};
  if (printer_is!='AUS') {
    msg=msg.replace(/\ {2,}/g," ");
    msg=get_time()+" "+msg;
    require('child_process').execSync('echo "'+msg+'" > /dev/ttyS0','e');
  }
}

var rpio = require('rpio');
rpio.open(12, rpio.OUTPUT, rpio.LOW);
function one_beep(){beep(1,80,0)};
function beep(times,duration,delay) {
  for (var i=0;i<times;i++) {
    setTimeout(function(){setTimeout(function(){rpio.write(12,rpio.LOW)},duration);rpio.write(12,rpio.HIGH)},i*delay);
  }
}

function get_shplst(host,id,shop,callback) {
  require('http').get({host:host, path:'?mode=escapedText&id='+id+'&shop='+shop}, function(r) {
    var res="";
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {callback(res)});
  }).on('error',(e)=>{setTimeout(function(){process.exit()},60000)})
}

function send_to_printer(msg) {
  msg=unescape(msg);
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]}).toUpperCase();
  var res="";
  var items = msg.split('\n');
  items.forEach( (i) => {var x=/###\ ([^\n]*)/.exec(i); if (x) {var c=(32-5-x[1].length); i+=' '; for (let y=0;y<c;y++) {i+='#'}; res+=i+'\n'} else {res+='    '+i+'\n'}});
  var p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  p.execSync('echo "'+res+'" > '+printer,'e');
}

function print_2d(puzzle) {
  var res = '';
  for (var row = 0; row < 9; row++) {
    for (var col = 0; col < 9; col++) {
      res += [""," "," ","  "," "," ","  "," "," "][col];
      if (['1','2','3','4','5','6','7','8','9'].indexOf(puzzle[row*9+col])>=0) {res += puzzle[row*9+col]} else {res+= '_'}
    }
    res += ['\n','\n','\n\n','\n','\n','\n\n','\n','\n','\n'][row];
  }
  return res;
}
