var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);
var global_say=()=>{};

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','twitter');
  socket.emit('join','#twitter');
  socket.emit('info','twitter-bot following '+config.twitter_follow+'. Usage: /m #twitter lt [screen_name] [count]');
  global_say=(m)=>{socket.emit('message',m.replace(/https?:\/\/[^\s]*/gi,'').replace(/[\n\r]/g,' '),{rooms:['#twitter']})};
});

socket.on('message', function(msg,meta) {
  if (meta&&meta.rooms&&meta.rooms.includes('#twitter')) {
    var t=(/lt\ ([\w_]+)\ (\d)$/i.exec(msg)); if (t) {latest_tweet(t[1],t[2])}; //post latest tweets
    var r=(/twitter_reset$/i.exec(msg)); if (r) {start_streaming(1)}; //reset
  }
});

const Twitter = require('twitter');
var client = new Twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

var stream = false;
setTimeout(()=>{start_streaming(1)},2500);
setInterval(()=>{start_streaming(1)},43200000*1); // reconnect every 12 *2 hours //

function start_streaming(delay) {
  if (delay>0) {global_say('=== CONNECT '+delay+' ===')}
  if (stream) {stream.destroy()}
  stream = client.stream('statuses/filter', {follow: config.twitter_follow});
  stream.on('data', function(event) {
    if ((event.text)&&(!event.text.startsWith('RT'))&&(!event.text.startsWith('@'))) {
      global_say('@'+event.user.screen_name+': '+event.text);
      delay = 2;
    }
  });
  stream.on('error', function(error) {
    global_say('===== ERROR ====='+JSON.stringify(error));
    console.log('=== ERROR: '+JSON.stringify(reason)); //
  });
  stream.on('end', function(reason) {
    global_say('====== END ======'); //
    console.log('=== END: '+JSON.stringify(reason)); //
    if (delay<128) {
      start_streaming(delay*2);
      //Seems like twitter is auto-reconnecting on END now... so maybe omit restart?
      //setTimeout(()=>{start_streaming(delay*delay)},delay*1000);
      //stream = client.stream('statuses/filter', {follow: config.twitter_follow});
    } else {global_say('= TWITTER END! =')}
  });
}


function latest_tweet(_screen_name,_count) {
  client.get('statuses/user_timeline', {screen_name: _screen_name, count:_count*3, include_rts:false, trim_user:true}, function(error, tweets, response) {
  if (!error) {
    tweets.forEach( (item,index) => {
      if (index<_count) {
        global_say('@'+_screen_name+': '+item.text);
      }
    });
  }
  });
};
