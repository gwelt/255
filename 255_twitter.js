var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);
var Parser = require('rss-parser');
var parser = new Parser();
var headlines=[];
var global_say=()=>{};

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','twitter');
  socket.emit('join','#twitter');
  socket.emit('info','Parsing rss-feeds to post latest news. Use lt to retweet for all or rt for personal retweet. Example: /m twitter rt 3');
  global_say=(m)=>{socket.emit('message',m.replace(/https?:\/\/[^\s]*/gi,'').replace(/[\n\r]/g,' '),{rooms:['#twitter']})};
});

socket.on('message', function(msg,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#twitter')) {
    var t1=(/lt\ (\d)$/i.exec(msg)); if (t1) {headlines.slice(-t1[1]).forEach(e=>e.print())}; //post latest tweets
    var t2=(/rt\ (\d)$/i.exec(msg)); if (t2) {headlines.slice(-t2[1]).forEach((m)=>{
      socket.emit('message',m.display(),{rooms:[(meta?meta.sender:undefined)]}); //post latest tweets as private response only
    })};
  }
});

setTimeout(()=>{poll(()=>{ 
  headlines.forEach((e)=>{e.printed=true});
  headlines.slice(-3).forEach(e=>e.print()); 
})},2500);

setInterval(()=>{poll(()=>{ 
  headlines.filter((e)=>{return !e.printed}).forEach(e=>e.print()); 
})},1000*60*(config.poll_delay_minutes||5)); // poll every 5 minutes

function poll(callback) {
  parser.parseURL('https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml',(err,feed)=>{
    feed.items.forEach(item=>{
      let nh=new Headline(item.guid,item.isoDate,item.title,feed.publisher,false);
      if (nh.is_valid()&&nh.is_new_headline()) {headlines.push(nh)}
    });
    headlines=headlines.filter((e)=>e.is_valid()).sort((a,b)=>{return a.date-b.date});
    callback();
  });
}

function Headline(guid,date,title,publisher,printed) {
  this.guid=guid;
  this.date=new Date(date);
  this.title=title;
  this.publisher=publisher;
  this.printed=printed;
}
Headline.prototype.is_new_headline=function() {
  return !(headlines.find((e)=>this.guid==e.guid));
}
Headline.prototype.age_in_minutes=function() {
  return Math.round((new Date()-new Date(this.date))/1000/60)
}
Headline.prototype.is_valid=function() {
  return this.age_in_minutes()<=(config.valid_for_minutes||1440);
}
Headline.prototype.ds=function() {
  return this.date.getDate().toString().padStart(2,'0')+'|'+this.date.getHours().toString().padStart(2,'0')+this.date.getMinutes().toString().padStart(2,'0');
}
Headline.prototype.display=function() {
  return this.title+' ('+this.ds()+'|'+this.publisher+')';
}
Headline.prototype.print=function() {
  this.printed=true;
  //console.log(this.display());
  global_say(this.display());
}
