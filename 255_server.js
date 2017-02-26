'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const server = express()
  .get('/m/:m', function(req, res) {broadcast(req.params.m);res.send()})
  .get('/', function(req, res) {res.sendFile(require('path').join(__dirname, '255_client_simple.html'))})
  .get('*', function(req, res) {res.send('404')})
  .listen(3000);
const wss = new SocketServer({ server });
var latest_message="JUST STARTED.";
wss.on('connection', (ws) => {
  ws.send('WELCOME #'+wss.clients.length+' ('+credit+')');
  ws.on('message', (msg) => {
    var auth="("+ws.name+") "; if (!ws.name) {auth=""};
    if (/^\//i.test(msg)) {
      if (/^\/nick\ /i.test(msg)) {var n=/^\/nick\ (.*)/i.exec(msg); ws.name=safe_text(n[1]); ws.send('Welcome, '+ws.name+'.');}
      if (/^\/repeat/i.test(msg)) {ws.send(latest_message)}
    } 
    else if (msg) {broadcast(auth+msg)}
  });
});
var credit=99; setInterval(function(){credit=99},60*60000);
function safe_text(text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,256)}
function broadcast(text) {if (credit>0) {try{wss.clients.forEach((ws) => {ws.send(safe_text(text))})} catch(err){}; credit--; latest_message=safe_text(text);}}
