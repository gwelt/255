'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const server = express()
  .use(function (req, res, next) {res.setHeader('Access-Control-Allow-Origin', 'http://gwelt.net'); next();})
  .get('/m/:m', function(req, res) {broadcast(req.params.m);res.send()})
  .get('/', function(req, res) {res.sendFile(require('path').join(__dirname, '255_client_simple.html'))})
  .get('*', function(req, res) {res.send('404')})
  .listen(3000);
const wss = new SocketServer({ server });
wss.on('connection', (ws) => {
  ws.send('WELCOME');
  broadcast('CLIENT CONNECTED');
  ws.on('message', (msg) => {if (msg) {broadcast(msg)}});
  ws.on('close', () => {broadcast('CLIENT DISCONNECTED')});
});
var credit=120;
setInterval(function(){credit=120},60*60000);
function safe_text(text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,256)}
function broadcast(text) {if (credit>0) {try{wss.clients.forEach((ws) => {ws.send(safe_text(text))})} catch(err){}; credit--}}
