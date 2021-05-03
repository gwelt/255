var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);
var global_say=()=>{};
var current_ip="";

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','box');
  socket.emit('join','#box');
  socket.emit('info','This is the box. Usage: /m #box drucker an/aus | licht an/aus | beep an/aus | beep [count] | bssid | essid | sudoku | sudokunew | shplst [id] | liga [bl1|bl2] [tabelle|spiele|check|update]');
  global_say=(m)=>{socket.emit('message',m,{rooms:['#box']})};
});

socket.on('message', function(data,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#box')) {
    //print(data);
    lcd_show(data);
    //if (/^--status$/i.test(data)) {global_say('DRUCKER:'+printer_is+' LICHT:'+light_is+' BEEP:'+beep_is)}
    if (/^drucker\ an$/i.test(data)) {printer_is='AN';global_say('          DRUCKER AN '+get_time(1))}
    if (/^drucker\ aus$/i.test(data)) {printer_is='AUS';global_say('          DRUCKER AUS '+get_time(1))}
    if (/^licht\ an$/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -t');global_say('          LICHT AN   '+get_time(1));light_is="AN"}
    if (/^licht\ aus$/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 1 -u 23 -r 15 -f');global_say('          LICHT AUS  '+get_time(1));light_is="AUS"}
    if (/^tv\ an$/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 2 -u 23 -r 15 -t');global_say('          TV AN      '+get_time(1));}
    if (/^tv\ aus$/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 2 -u 23 -r 15 -f');global_say('          TV AUS     '+get_time(1));}
    if (/^baum\ an$/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 3 -u 23 -r 15 -t');global_say('          BAUM AN    '+get_time(1));}
    if (/^baum\ aus$/i.test(data)) {require('child_process').execSync(__dirname+'/sendElro -i 3 -u 23 -r 15 -f');global_say('          BAUM AUS   '+get_time(1));}
    if (/^bssid$/i.test(data)) {global_say(require('child_process').execSync('iwlist wlan0 scanning | grep -o ..:..:..:..:..:..',{stdio:'pipe'}).toString().replace(/[\r\n]/g,' '))}
    if (/^essid$/i.test(data)) {global_say(require('child_process').execSync("iwlist wlan0 scanning | grep ESSID",{stdio:'pipe'}).toString().replace(/\ /g,''))}
    let b=(/^beep\ (\d)$/i.exec(data)); if (b) {if (beep_is!='AUS') {beep(b[1],20,100)}};
    if (/^beep\ an$/i.test(data)) {beep_is='AN';  global_say('           BEEP AN   '+get_time(1))}
    if (/^beep\ aus$/i.test(data)) {beep_is='AUS';global_say('           BEEP AUS  '+get_time(1))}
    let shplst=(/^shplst\ ([^\ ]*)$/i.exec(data)); if (shplst) {global_say('PRINTING SHOPPINGLIST');get_shplst(shplst[1],'LIDL',send_to_printer)}
    let liga_all=(/^liga\ ([^\ ]*)$/i.exec(data)); if (liga_all) {
     	global_say('OK LIGA '+liga_all[1]);
    	if (liga_all[1]=='bl') {
   	  	get_liga('bl1/check',(msg)=>{
     			send_to_printer(msg);
   	  		get_liga('bl1/print',(msg)=>{send_to_printer(msg)});		
   		  	get_liga('bl2/check',(msg)=>{
     				send_to_printer(msg);
   		  		get_liga('bl2/print',(msg)=>{send_to_printer(msg)});		
    	 	 	});
   	  	});
    	} else {
   	  	get_liga(liga_all[1]+'/check',(msg)=>{
     			send_to_printer(msg);
   	  		get_liga(liga_all[1]+'/print',(msg)=>{send_to_printer(msg)});
   	  	});
    	}
      let liga=(/^liga\ ([^\ ]*)\ ([^\ ]*)$/i.exec(data)); if (liga) {
        if ((liga[2]=='check')||(liga[2]=='update')) {global_say('OK LIGA '+liga[1]+' '+liga[2].toUpperCase());get_liga(liga[1]+'/'+liga[2],send_to_printer)}
        else {global_say('OK LIGA '+liga[1]+' PRINT');get_liga(liga[1]+'/print/'+liga[2],send_to_printer)}
      }
    }
    if (/^sudokunew$/i.test(data)) {
      global_say('PRINTING NEW SUDOKU');
      var puzzle=require('../sudoku/sudoku_generator.js').generate_with_masks();
      var s=require('../sudoku/sudoku_solver.js').solve(puzzle[0]);
      var hints=puzzle[0].split('').map((c)=>{return c=='-'?0:1}).reduce((l,r)=>{return l+r},0);
      send_to_printer('\n    PUZZLE:\n'+print_2d(puzzle[0])+'\n\n    SOLUTION:\n'+print_2d(puzzle[1])+'\n    RATING: '+s.stats.dig_needed+'.'+hints+'\n\n');
    }
    if (/^sudoku$/i.test(data)) {
      global_say('PRINTING SUDOKU');
      get_sudoku('api/get',(json)=>{
        let sudoku=JSON.parse(json);
        //send_to_printer('\n    PUZZLE:\n'+print_2d(sudoku.puzzle)+'\n\n    SOLUTION:\n'+print_2d(sudoku.solution)+'\n\n');
        send_to_printer('\n    PUZZLE:\n'+print_2d(sudoku.puzzle)+'\n\n    CURRENT:\n'+print_2d(sudoku.current)+'\n\n    SOLUTION:\n'+print_2d(sudoku.solution)+'\n\n');
      })
    }
  }
});

const interface="wlan0";
const printer="/dev/ttyS0";
const baudrate="9600";
var printer_is='AN';
var beep_is='AUS';
var light_is='?';

const path = require('path');
var lcd = require('child_process').fork(path.join(__dirname, 'LCD.js'));
//lcd.send('READY.');
function lcd_show(msg) {
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]});
  lcd.send(msg);
}

p=require('child_process');
p.execSync('stty -F '+printer+' '+baudrate);
//var welcome="================================\\nIP: "+require('os').networkInterfaces()[interface][0]['address']+" ("+interface+")\\nConnect @"+config.websocket_url+"\\n================================"; //\\nPrinter: "+printer+" @"+baudrate+" baud
//p.execSync('echo "'+welcome+'" > '+printer,'e');

Date.prototype.addHours= function(h){this.setHours(this.getHours()+h); return this;}
//winter: addHours(1), summer: addHours(2)
function get_time(long) {var date=new Date().addHours(0);var hour=date.getHours();hour=(hour<10?"0":"")+hour;var min=date.getMinutes();min=(min<10?"0":"")+min;return hour+((long)?":":"")+min;}
function print(msg) {
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

function get_shplst(id,shop,callback) {
  require('https').get({host:'gwelt.net', path:'/shp/?mode=escapedText&id='+id+'&shop='+shop}, function(r) {
    var res="";
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {callback(res)});
  }).on('error',(e)=>{say('PRINTING SHPLST FAILED');console.log(e)})
}

function get_liga(request,callback) {
  require('https').get({host:'gwelt.net', path:'/liga/'+request}, function(r) {
    var res="";
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {callback(res)});
  }).on('error',(e)=>{say('PRINTING LIGA FAILED');console.log(e)})
}

function get_sudoku(request,callback) {
  require('https').get({host:'gwelt.net', path:'/sudoku/'+request}, function(r) {
    var res="";
    r.on('data', function(d) {res+=d}); 
    r.on('end', function() {callback(res)});
  }).on('error',(e)=>{say('PRINTING SUDOKU FAILED');console.log(e)})
}

function send_to_printer(msg) {
  msg=unescape(msg);
  var mapUmlaute = {ä:"ae",ü:"ue",ö:"oe",Ä:"Ae",Ü:"Ue",Ö:"Oe",ß:"ss"};
  msg=msg.replace(/[äüöÄÜÖß]/g,function(m){return mapUmlaute[m]}).toUpperCase();
  var res="";
  var items = msg.split('\n');
  items.forEach( (i) => {var x=/###\ ([^\n]*)/.exec(i); if (x) {var c=(32-5-x[1].length); i+=' '; for (let y=0;y<c;y++) {i+='#'}; res+=i+'\n'} else {res+=i+'\n'}});
  var p=require('child_process');
  p.execSync('stty -F '+printer+' '+baudrate);
  p.execSync('echo "'+res+'" > '+printer,'e');
}

function print_2d(puzzle) {
  var res = '';
  for (var row = 0; row < 9; row++) {
    for (var col = 0; col < 9; col++) {
      res += ["    "," "," ","  "," "," ","  "," "," "][col];
      if (['1','2','3','4','5','6','7','8','9'].indexOf(puzzle[row*9+col])>=0) {res += puzzle[row*9+col]} else {res+= '_'}
    }
    res += ['\n','\n','\n\n','\n','\n','\n\n','\n','\n','\n'][row];
  }
  return res;
}
