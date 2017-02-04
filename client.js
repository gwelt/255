var ws=ws_open(location.origin.replace(/^http/, 'ws')+'/socket');
var tweets=[];

function tweet(t) {
  if (t) {tweets.push(t)}
  while (tweets.length>8) {tweets.splice(0,1)}
  var etweet=document.getElementById('text');
  if (etweet) {
    etweet.innerHTML="";
    tweets.forEach(function(tt) {etweet.innerHTML+=tt+"<br>"});
  };
}

function ws_open(url) {
  try {ws=new WebSocket(url)} catch (err){alert(err);ws=false};
  if (ws) {
    ws.onmessage = function (message) {tweet(message.data.substr(0))}
  }
  return ws;
}

