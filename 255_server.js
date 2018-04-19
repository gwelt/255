'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
var publicip="";
const server = express()
  .get('/m/:m', function(req, res) {broadcast(req.params.m);res.send('')})
  .get('/api/setpublicip', function(req, res) {var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; publicip=ip.replace(/^.*:/, ''); res.send(publicip);})
  .get('/api/getpublicip', function(req, res) {res.send(publicip)})
  .get('/api/local', function(req, res) {res.send('<HTML><HEAD><META HTTP-EQUIV="refresh" CONTENT="0;URL=http://'+publicip+':8080"></HEAD></HTML>')})
  .get('/', function(req, res) {res.sendFile(require('path').join(__dirname,'255_client_simple.html'))})
  .get('*', function(req, res) {res.send('404')})
  .listen(3000);
const wss = new SocketServer({ server });
var latest_message="JUST STARTED.";
wss.on('connection', (ws) => {
  ws.send('WELCOME #'+wss.clients.length+' ('+credit+')');
  ws.on('message', (msg) => {
    var auth="("+ws.name+") "; if (!ws.name) {auth=""};
    if (/^\//i.test(msg)) {
      if (/^\/help/i.test(msg)) {ws.send('help: /nick [name] | /repeat | /credit | /getip | /restart')}
      if (/^\/nick\ /i.test(msg)) {var n=/^\/nick\ (.*)/i.exec(msg); ws.name=safe_text(n[1]); ws.send('Welcome, '+ws.name+'.');}
      if (/^\/repeat/i.test(msg)) {ws.send(latest_message)}
      if (/^\/credit$/i.test(msg)) {credit=99;ws.send('Credit: '+credit)}
      if (/^\/getip$/i.test(msg)) {ws.send(ws._socket.remoteAddress.replace(/^.*:/, ''))}
      if (/^\/restart$/i.test(msg)) {ws.send('Ok. Restarting.');setTimeout(function(){process.exit()},3000)}
    } 
    else if (msg) {broadcast(auth+msg)}
    if (/^\(publicIP\)\ +\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i.test(msg)) {var n=/^\(publicIP\)\ +(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(msg); publicip = n[1];}
  });
});
var credit=99; setInterval(function(){credit=99},60*60000);
function safe_text(text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,256)}
function broadcast(text) {if (credit>0) {try{wss.clients.forEach((ws) => {ws.send(safe_text(text))})} catch(err){}; credit--; latest_message=safe_text(text);}}
