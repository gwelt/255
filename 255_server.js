'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config.json');

var publicip="";
var latest_message="JUST STARTED.";
var credit=99; setInterval(function(){credit=99},60*60000);

app.use('/255/m/:m', function(req, res) {broadcast(req.params.m);res.send('')})
app.use('/255/api/setpublicip', function(req, res) {var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; publicip=ip.replace(/^.*:/, ''); res.send(publicip);})
app.use('/255/api/getpublicip', function(req, res) {res.send(publicip)})
app.use('/255/api/local', function(req, res) {res.send('<HTML><HEAD><META HTTP-EQUIV="refresh" CONTENT="0;URL=http://'+publicip+':8080"></HEAD></HTML>')})
app.use('/255', function(req, res) {res.sendFile(require('path').join(__dirname,'255_client_simple.html'))})
app.use('/', function(req, res) {res.sendFile(require('path').join(__dirname,'255_client_simple.html'))})
app.use('*', function(req, res) {res.send('404 255_server')})
server.listen(config.socket_server_port||3000,()=>{console.log(new Date().toISOString()+' | SERVER STARTED, PORT: '+config.socket_server_port)});

io.on('connection', (socket) => {
  socket.emit('message','WELCOME #'+io.engine.clientsCount+' ('+credit+')');
  socket.on('message', (msg) => {
    var auth="("+socket.name+") "; if (!socket.name) {auth=""};
    if (/^\//i.test(msg)) {
      if (/^\/help/i.test(msg)) {socket.emit('message','help: /nick [name] | /repeat | /credit | /restart')}
      if (/^\/nick\ /i.test(msg)) {var n=/^\/nick\ (.*)/i.exec(msg); socket.name=safe_text(n[1]); socket.emit('message','Welcome, '+socket.name+'.');}
      if (/^\/repeat/i.test(msg)) {socket.emit('message',latest_message)}
      if (/^\/credit$/i.test(msg)) {credit=99;socket.emit('message','Credit: '+credit)}
      if (/^\/restart$/i.test(msg)) {socket.emit('message','Ok. Restarting.');setTimeout(function(){process.exit()},3000)}
    } 
    else if (msg) {broadcast(auth+msg)}
    //if (/^\(publicIP\)\ +\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i.test(msg)) {var n=/^\(publicIP\)\ +(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(msg); publicip = n[1];}
  });
});
function safe_text(text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,256)}
function broadcast(text) {if (credit>0) {try{io.sockets.emit('message',safe_text(text))} catch(err){}; credit--; latest_message=safe_text(text);}}
