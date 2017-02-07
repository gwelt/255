var ws=ws_open(location.origin.replace(/^http/, 'ws'));
var tweets=[];

function send_message(m) {if (m) {if (ws) {ws.send(m)} else {var req = new XMLHttpRequest(); req.open('GET',window.location+m); req.send();}}}

function tweet(t) {
  if (t) {tweets.push(t)}
  while (tweets.length>8) {tweets.splice(0,1)}
  var etweet=document.getElementById('text');
  if (etweet) {
    etweet.innerHTML="";
    tweets.forEach(function(tt) {etweet.innerHTML+=tt+"<br>"});
    var form="<input id='message' type='text'><button onclick=send_message(document.getElementById('message').value)>&gt;</button>";
    etweet.innerHTML+=form;
  };
}

function ws_open(url) {
  ws=new WebSocket(url);
  ws.onmessage = function (message) {console.log(message);tweet(message.data)};
  ws.onerror = function(e) {console.log(e);tweet('CONNECTION ERROR ['+e.currentTarget.url+']')};
  ws.onclose = function(user) {console.log(user);tweet('CONNECTION CLOSED');ws=0;};
  return ws;
}
