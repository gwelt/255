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

client.stream('statuses/filter', {follow: config.twitter_follow}, function(stream) {
  stream.on('data', function(event) {
    if ((event.text)&&(!event.text.startsWith('RT'))&&(!event.text.startsWith('@'))) {
      global_say('@'+event.user.screen_name+': '+event.text);
    }
  });
  stream.on('error', function(error) {
    global_say('ERROR '+error);
  });
  stream.on('end', function(reason) {
    global_say('END '+reason);
  });
});

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
