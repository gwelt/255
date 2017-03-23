// YOU NEED TO EDIT THIS BEFORE STARTING A BOT
function Configuration() {
  this.websocket_url='ws://255.gwelt.net:3000';
  this.websocket_ping_delay=60000;
  this.publicIPserver_url='local.gwelt.net';
  this.twitter_consumer_key='laBMpI12fTAuMoSGGUiyWQ3s4';
  this.twitter_consumer_secret='FNp10a0gx4zox1p1VQRuPQzlO0VRW7Bskicy46ZFi29w5D0rNV';
  this.twitter_access_token_key='144484262-EQ7mSMHzBejWRaejeXh4fFEwAZaQsdtDd65thDb5';
  this.twitter_access_token_secret='TtKLLZFWTUE4mxOv8yv3zNez3R4tQZahUVhCrT8uQGD2t';
  this.twitter_follow='3197921,15379430,40227292';  
// https://dev.twitter.com/streaming/overview/request-parameters //heiseonline:3197921 //rotero:15379430 //dpa:40227292
/*
  this.websocket_url='ws://[your-255_server.js-ws-url]:3000'; // URL, where 255_server.js is running
  this.websocket_ping_delay=60000;
  this.publicIPserver_url='[publicIPserver_url]'; // URL of a server that saves the requesting IP (?set) and delivers that saved IP (?get)
  this.twitter_consumer_key='[your_twitter_consumer_key]';
  this.twitter_consumer_secret='[your_twitter_consumer_secret]';
  this.twitter_access_token_key='[your_twitter_access_token_key]';
  this.twitter_access_token_secret='[your_twitter_access_token_secret]';
  this.twitter_follow='[list of twitter_userIDs to follow]';
*/
}
module.exports = Configuration;
