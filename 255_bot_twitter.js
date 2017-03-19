const Configuration = require('./255_conf.js');
var config = new Configuration();
const WebSocket = require('ws');
var ws_255 = new WebSocket(config.websocket_url);
ws_255.on('open', function() {setInterval(function(){ws_255.send('',function ack(err){if (err) {process.exit()}})},config.websocket_ping_delay)}); // send empty message to stay connected, exit if sending fails
ws_255.on('error', function(e) {process.exit()});
ws_255.on('close', function(user) {process.exit()});
const Twitter = require('twitter');
var client = new Twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

const myname="(Twitter)";

ws_255.on('message', function incoming(data, flags) {
  if (!data.startsWith(myname)) {
    if (/--status/i.test(data)) {say('listening')}
    if (/--help/i.test(data)) {say('help: lt [screen_name] [count]')}
    //if (/latesttweet$/i.test(data)) {latest_tweet('heiseonline',1)}
    var t=(/lt\ ([\w_]+)\ (\d)$/i.exec(data)); if (t) {latest_tweet(t[1],t[2])}; //post latest tweets
  }
});

function say(text) {ws_255.send(myname+' '+text)}

client.stream('statuses/filter', {follow: config.twitter_follow}, function(stream) {
  stream.on('data', function(event) {
    if ((event.text)&&(!event.text.startsWith('RT'))&&(!event.text.startsWith('@'))) {
      say('@'+event.user.screen_name+': '+event.text);
    }
  });
});

function latest_tweet(_screen_name,_count) {
  client.get('statuses/user_timeline', {screen_name: _screen_name, count:_count*2, include_rts:false, trim_user:true}, function(error, tweets, response) {
  if (!error) {
    tweets.forEach( (item,index) => {
      if (index<_count) {
        //var hashtags=[];
        //item.entities.hashtags.forEach( (item,index) => {hashtags.push(item.text)});
        //console.log(item.created_at+': '+item.text)//+' ---> '+hashtags.toString())
        say('@'+_screen_name+': '+item.text);
      }
    });
  }
  });
};
