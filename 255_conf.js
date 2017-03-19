// YOU NEED TO EDIT THIS BEFORE STARTING A BOT
function Configuration() {
  this.websocket_url='ws://[your-255_server.js-ws-url]:3000'; // URL, where 255_server.js is running
  this.websocket_ping_delay=60000;
  this.publicIPserver_url='[publicIPserver_url]'; // URL of a server that saves the requesting IP (?set) and delivers that saved IP (?get)
  this.twitter_consumer_key='[your_twitter_consumer_key]';
  this.twitter_consumer_secret='[your_twitter_consumer_secret]';
  this.twitter_access_token_key='[your_twitter_access_token_key]';
  this.twitter_access_token_secret='[your_twitter_access_token_secret]';
  this.twitter_follow='[list of twitter_userIDs to follow]';
}
module.exports = Configuration;
