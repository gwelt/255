'use strict';
const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const CLIENTJS = path.join(__dirname, 'client.js');
const server = express()
  .use('/m/:m', function(req, res) {broadcast(req.params.m); res.send('ok')})
  .use((req, res) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    if (req.url=="/") {res.sendFile(INDEX)}
    else if (req.url=="/client.js") {res.sendFile(CLIENTJS)}
    else if (req.query.m) {broadcast(req.query.m); res.send('ok')}
    else {res.send('404')}
  })
  .listen(PORT, function() {process.stdout.write(`\x1b[44m SERVER LISTENING ON PORT ${ PORT } \x1b[0m `)});
const wss = new SocketServer({ server });

function isEmptyObject(obj) {return !Object.keys(obj).length;}

///--- CONNECTION-HANDLER ---///
function broadcast(text) {try{wss.clients.forEach((ws) => {ws.send(text)})} catch(err){};}
wss.on('connection', (ws) => {
  ws.send('WELCOME');
  broadcast('CLIENT CONNECTED');
  //ws.on('message', (msg) => {if (msg) {broadcast(msg)}});
  ws.on('close', () => {broadcast('CLIENT DISCONNECTED')});
});
