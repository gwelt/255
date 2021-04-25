'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config.json');

const own_client_socket = require('socket.io-client')('http://'+config.socket_server+':'+config.socket_server_port||'3000');
own_client_socket.emit('info','Listening to '+config.socket_server+':'+(config.socket_server_port||'3000')+'/m and posting everything to #broadcast.');
own_client_socket.emit('leave','#broadcast');

var publicip="";
var latest_message="JUST STARTED.";
var credit=99; setInterval(function(){credit=99},60*60000);

app.use(bodyParser.json({ strict: true }));
app.use(function (error, req, res, next){next()}); // don't show error-message, if it's not JSON ... just ignore it
app.use(bodyParser.urlencoded({ extended: true }));
app.use('(/255)?/m/:m?', function(req, res) {
	if (req.body.m) {
		own_client_socket.emit('message',req.body.m,{rooms:['#broadcast']});
		res.send('ok');
	} else if (req.params.m) {
		own_client_socket.emit('message',req.params.m,{rooms:['#broadcast']});
		res.send('ok');
	}
})
app.use('(/255)?/api/setpublicip', function(req, res) {var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; publicip=ip.replace(/^.*:/, ''); res.send(publicip);})
app.use('(/255)?/api/getpublicip', function(req, res) {res.send(publicip)})
app.use('(/255)?/api/local', function(req, res) {res.send('<HTML><HEAD><META HTTP-EQUIV="refresh" CONTENT="0;URL=http://'+publicip+':8080"></HEAD></HTML>')})
app.use('(/255)?', function(req, res) {res.sendFile(require('path').join(__dirname,'255_client_simple.html'))})
app.use('*', function(req, res) {res.send('404 255_server')})
server.listen(config.socket_server_port||3000,()=>{console.log(new Date().toISOString()+' | SERVER STARTED, PORT: '+config.socket_server_port)});

io.on('connection', (socket) => {
	socket.emit('message','WELCOME #'+io.engine.clientsCount+' ('+credit+')');
	socket.join('#broadcast');
	socket.data={};

	socket.on('name', (name) => {socket.data.name=safe_text(name); socket.emit('message','Welcome, '+socket.data.name+'.')});
	socket.on('info', (info) => {socket.data.info=safe_text(info); socket.emit('message','Your info is: '+socket.data.info)});
	socket.on('join', (room) => {socket.join(room); socket.emit('message','You are joining '+room+' now.')});
	socket.on('leave', (room) => {socket.leave(room); socket.emit('message','You left '+room+'.')});
	socket.on('message', (msg,meta) => {
		if (/^\//i.test(msg)) {
			if (/^\/help/i.test(msg)) {socket.emit('message','help: /nick [name] | /repeat | /credit | /restart | /users | /join [room] | /leave [room] | /rooms | /m [room] [message]')}
			if (/^\/repeat/i.test(msg)) {socket.emit('message',latest_message)}
			if (/^\/credit$/i.test(msg)) {credit=99;socket.emit('message','Credit: '+credit)}
			if (/^\/restart$/i.test(msg)) {socket.emit('message','Ok. Restarting.');setTimeout(function(){process.exit()},3000)}
			let name=(/^\/(name|nick)\ ([^\ ]*)$/i.exec(msg)); if (name) {socket.data.name=safe_text(name[2]); socket.emit('message','Welcome, '+socket.data.name+'.')};
			let join=(/^\/join\ ([^\ ]*)$/i.exec(msg)); if (join) {socket.join(join[1]); socket.emit('message','You are joining '+join[1]+' now.')};
			let leave=(/^\/leave\ ([^\ ]*)$/i.exec(msg)); if (leave) {socket.leave(leave[1]); socket.emit('message','You left '+leave[1]+'.')};
			let message_to_room=(/^\/m\ ([^\ ]*)\ (.*)$/i.exec(msg)); if (message_to_room&&message_to_room[2]) {
				//io.to(socket.id).to(message_to_room[1]).emit('message',safe_text(message_to_room[2]),{sender:socket.id,name:safe_text(socket.data.name),rooms:[socket.id,safe_text(message_to_room[1])]});
				io.to(message_to_room[1]).emit('message',safe_text(message_to_room[2]),{sender:socket.id,name:safe_text(socket.data.name),rooms:[safe_text(message_to_room[1])]});
			};
			if (/^\/rooms$/i.test(msg)) {socket.emit('message','You are joining these rooms: '+JSON.stringify([...socket.rooms]))}
			async function fetchSockets(callback) {callback(await io.fetchSockets())}
			if (/^\/users$/i.test(msg)) {fetchSockets((s)=>{ let s2=s.map((e)=>{return {id:e.id,data:e.data,rooms:[...e.rooms].slice(1)}}); socket.emit('message',s2.length+' users online. '+JSON.stringify(s2)) })}
		} 
		else if (msg&&credit>0) {
			//io.sockets.emit('message',safe_text(msg),{sender:socket.id,name:safe_text(socket.data.name),rooms:undefined}); // << broadcast to all
			if ((meta&&meta.rooms) && (Array.isArray(meta.rooms)) && (meta.rooms.length>0)) {} else {
				meta=meta||{};
				meta.rooms=[...socket.rooms].filter((r)=>{return r!==socket.id});
			} //['#broadcast']
			if (meta.rooms.includes('#broadcast')) {credit--; latest_message=safe_text(msg);};
			let ioto=io; meta.rooms.forEach((r)=>{ioto=ioto.to(r)})
			ioto.emit('message',safe_text(msg),{sender:socket.id,name:safe_text(socket.data.name),rooms:meta.rooms});
		};
	});
});
function safe_text(text) {if (text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,256)} else {return undefined}}
