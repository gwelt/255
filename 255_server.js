'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const server = express()
  .use((req, res) => {
    if (req.url=="/") {res.sendFile(require('path').join(__dirname, '255_client_simple.html'))}
    else {broadcast(req.url);res.send()}
  })
  .listen(3000);
const wss = new SocketServer({ server });
wss.on('connection', (ws) => {
  ws.send('WELCOME');
  broadcast('CLIENT CONNECTED');
  ws.on('message', (msg) => {if (msg) {broadcast(msg)}});
  ws.on('close', () => {broadcast('CLIENT DISCONNECTED')});
});
function safe_text(text) {return text.replace(/[^\w\ !]/g,'').slice(0,32)}
function broadcast(text) {try{wss.clients.forEach((ws) => {ws.send(safe_text(text))})} catch(err){};}
