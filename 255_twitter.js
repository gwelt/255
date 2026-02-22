var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);
var Parser = require('rss-parser');
var parser = new Parser();
var headlines=[];
var all_publishers=['tagesschau.de','NDR','HEISE','Postillon'];
var active_publishers=[...all_publishers];
var global_say=()=>{};

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','twitter');
  socket.emit('join','#twitter');
  socket.emit('info','Parsing rss-feeds to post latest news. Use lt to retweet for all or rt for personal retweet. (also: status, on, off) Example: /m twitter rt 3');
  global_say=(m)=>{socket.emit('message',m.replace(/https?:\/\/[^\s]*/gi,'').replace(/[\n\r]/g,' '),{rooms:['#twitter']})};
});

socket.on('message', function(msg,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#twitter')) {
    var t1=(/lt\ (\d)$/i.exec(msg)); if (t1) {headlines.slice(-t1[1]).forEach(e=>e.print())}; //post latest tweets
    var t2=(/rt\ (\d)$/i.exec(msg)); if (t2) {headlines.slice(-t2[1]).forEach((m)=>{
      socket.emit('message',m.display(),{rooms:[(meta?meta.sender:undefined)]}); //post latest tweets as private response only
    })};
    var t3=(/status$/i.exec(msg)); if (t3) {
      socket.emit('message','on: '+active_publishers.toString()+' | '+'off: '+all_publishers.filter((v)=>{return !active_publishers.includes(v)}).toString(),{rooms:[(meta?meta.sender:undefined)]}); //post latest tweets as private response only
    };
    var t4=(/on\ (.*)$/i.exec(msg)); if (t4) {
      if (all_publishers.includes(t4[1])) {
        active_publishers.push(t4[1]);
        socket.emit('message','on: '+active_publishers.toString()+' | '+'off: '+all_publishers.filter((v)=>{return !active_publishers.includes(v)}).toString(),{rooms:[(meta?meta.sender:undefined)]}); //post latest tweets as private response only
      }};
    var t5=(/off\ (.*)$/i.exec(msg)); if (t5) {
      if (active_publishers.includes(t5[1])) {
        active_publishers=active_publishers.filter((v)=>{return !(v==t5[1])});
        socket.emit('message','on: '+active_publishers.toString()+' | '+'off: '+all_publishers.filter((v)=>{return !active_publishers.includes(v)}).toString(),{rooms:[(meta?meta.sender:undefined)]}); //post latest tweets as private response only
      }
    };
  }
});

poll(true);
setTimeout(()=>{headlines.slice(-3).forEach(e=>e.print())},7500);
setInterval(()=>{poll(false)},1000*60*(config.poll_delay_minutes||5)); // poll every 5 minutes

function Headline(guid,date,title,publisher,printed) {
  this.guid=guid;
  this.date=new Date(date);
  this.title=title;
  this.publisher=publisher;
  this.printed=printed||false;
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
  //return this.date.getHours().toString().padStart(2,'0')+this.date.getMinutes().toString().padStart(2,'0');
}
Headline.prototype.display=function() {
  return this.title+' ('+this.ds()+'|'+this.publisher+')';
}
Headline.prototype.print=function() {
  this.printed=true;
  //console.log(this.display());
  global_say(this.display());
}

function poll(printed) {
  if (active_publishers.includes('tagesschau.de')) {
    poll_url('https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml','guid','isoDate','title','tagesschau.de',printed);
  }
  if (active_publishers.includes('NDR')) {
    poll_url('https://www.tagesschau.de/inland/regional/hamburg/index~rss2.xml','guid','isoDate','title','NDR',printed);
  }
  if (active_publishers.includes('HEISE')) {
    poll_url('https://www.heise.de/rss/heise-top-atom.xml','id','isoDate','title','HEISE',printed);
  }
  if (active_publishers.includes('Postillon')) {
    poll_url('https://follow.it/der-postillon-abo/rss','guid','pubDate','title','Postillon',printed);
  }
}

function poll_url(url,attr_id,attr_date,attr_title,publisher,printed) {
  if (active_publishers.includes(publisher)) {
    parser.parseURL(url,(err,feed)=>{
      if (feed&&feed.items) {
        feed.items.forEach(item=>{
          let nh=new Headline(item[attr_id],item[attr_date],item[attr_title],publisher,printed);
          if (nh.is_valid()&&nh.is_new_headline()) {headlines.push(nh)}
        });
        print_new_headlines();
      } else {console.log(new Date().toISOString()+' | ERROR PARSING: '+publisher+' - '+url)}
    });
  }
}

function print_new_headlines() {
  headlines=headlines.filter((e)=>e.is_valid()).sort((a,b)=>{return a.date-b.date});
  headlines.filter((e)=>{return !e.printed}).forEach(e=>e.print());
}
