'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const server = express()
  .get('/m/:m', function(req, res) {
    broadcast(req.params.m);res.send();
  })
  .get('/', function(req, res) {
    res.sendFile(require('path').join(__dirname, '255_client_simple.html'))
  })
  .listen(3000);
const wss = new SocketServer({ server });
wss.on('connection', (ws) => {
  ws.send('WELCOME');
  broadcast('CLIENT CONNECTED');
  ws.on('message', (msg) => {if (msg) {broadcast(msg)}});
  ws.on('close', () => {broadcast('CLIENT DISCONNECTED')});
});
function safe_text(text) {return unescape(text).replace(/[^\w\s\.,'!\@#$^&%*()+=-\[\]\/{}\|:\?]/g,'').slice(0,32)} //!@#$^&%*()+=-[]\/{}|:<>?,.
function broadcast(text) {try{wss.clients.forEach((ws) => {ws.send(safe_text(text))})} catch(err){};}
