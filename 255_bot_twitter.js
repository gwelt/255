var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('Twitter',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say('listening')}
  if (/--help/i.test(data)) {say('help: lt [screen_name] [count]')}
  var t=(/lt\ ([\w_]+)\ (\d)$/i.exec(data)); if (t) {latest_tweet(t[1],t[2])}; //post latest tweets
}

var config = require('./config.json');
const Twitter = require('twitter');
var client = new Twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

var stream = false;
function start_streaming(delay) {
  setTimeout(()=>{start_streaming(2)},43200000); // reconnect every 12 hours
  global_say('CONNECTING '+delay);
  stream = client.stream('statuses/filter', {follow: config.twitter_follow});
  stream.on('start', function(response) {
    global_say('START '+JSON.stringify(response));
  });
  stream.on('data', function(event) {
    if ((event.text)&&(!event.text.startsWith('RT'))&&(!event.text.startsWith('@'))) {
      global_say('@'+event.user.screen_name+': '+event.text);
      delay = 2;
    }
  });
  stream.on('error', function(error) {
    global_say('ERROR '+JSON.stringify(error));
    //process.nextTick(() => stream.destroy());
  });
  stream.on('end', function(reason) {
    global_say('END '+JSON.stringify(reason));
    setTimeout(()=>{start_streaming(delay*delay)},delay*1000);
  });
}
setTimeout(()=>{start_streaming(2)},2500);

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
