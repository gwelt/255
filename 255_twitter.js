var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);
var global_say=()=>{};

socket.on('connect', function() {
  console.log(new Date().toISOString()+' | '+socket.id)
  socket.emit('name','twitter');
  socket.emit('info','twitter-bot following '+config.twitter_follow+'. Usage: /m #twitter lt [screen_name] [count]');
  socket.emit('join','#twitter');
  global_say=(m)=>{socket.emit('message',m)};
});

socket.on('message', function(msg,meta) {
  //if (/twitter-reconnect/i.test(msg)) {start_streaming(2);global_say('reconnecting')}
  //if (/^twitter-status$/i.test(msg)) {global_say(JSON.stringify(stream))}
  //if (/^--status$/i.test(msg)) {global_say('listening, '+JSON.stringify(stream))}
  //if (/--help/i.test(msg)) {global_say('help: lt [screen_name] [count], twitter-reconnect, twitter-status')}
  var t=(/lt\ ([\w_]+)\ (\d)$/i.exec(msg)); if (t) {latest_tweet(t[1],t[2])}; //post latest tweets
});

const Twitter = require('twitter');
var client = new Twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

var stream = false;
function start_streaming(delay) {
  if (stream!==false) {
    //process.nextTick(() => stream.destroy());
  }
  global_say('CONNECT '+delay);
  stream = client.stream('statuses/filter', {follow: config.twitter_follow});
  //global_say(JSON.stringify(stream));
  stream.on('start', function(response) {
    global_say('===== START =====');
    //global_say('START '+JSON.stringify(response));
  });
  stream.on('data', function(event) {
    if ((event.text)&&(!event.text.startsWith('RT'))&&(!event.text.startsWith('@'))) {
      global_say('@'+event.user.screen_name+': '+event.text);
      delay = 2;
    }
  });
  stream.on('error', function(error) {
    global_say('ERROR '+JSON.stringify(error));
  });
  stream.on('end', function(reason) {
    global_say('====== END ======');
    //global_say('END '+JSON.stringify(reason));
    if (delay<1000000) {
      setTimeout(()=>{start_streaming(delay*delay)},delay*1000);
    } else {global_say('= TWITTER END! =')}
  });
}
setTimeout(()=>{start_streaming(2)},2500);
//setInterval(()=>{start_streaming(2)},43200000/2); // reconnect every 6 hours

function latest_tweet(_screen_name,_count) {
  client.get('statuses/user_timeline', {screen_name: _screen_name, count:_count*3, include_rts:false, trim_user:true}, function(error, tweets, response) {
  if (!error) {
    tweets.forEach( (item,index) => {
      if (index<_count) {
        //var hashtags=[];
        //item.entities.hashtags.forEach( (item,index) => {hashtags.push(item.text)});
        //console.log(item.created_at+': '+item.text)//+' ---> '+hashtags.toString())
        global_say('@'+_screen_name+': '+item.text);
      }
    });
  }
  });
};
