'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');
const INDEX = path.join(__dirname, 'index.html');
const server = express()
  .use((req, res) => {
    if (req.url=="/") {res.sendFile(INDEX)}
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
