'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config.json');

app.use(bodyParser.json({ strict: true }));
app.use(function (error, req, res, next){next()}); // don't show error-message, if it's not JSON ... just ignore it
app.use(bodyParser.urlencoded({ extended: true }));
app.use('(/255)?/m/:m?', function(req, res) {
	if (req.params.m) {own_client_socket.emit('message',req.params.m,{rooms:['#broadcast']})};
	res.send('ok');
})
app.use('(/255)?', function(req, res) {
	if ((req.method=='POST')&&(req.body)) {
		if (req.body.message) {
			own_client_socket.emit('message',req.body.message,{rooms:(Array.isArray(req.body.rooms)?req.body.rooms:['#broadcast'])});
			res.send('ok');
		} else {res.send('usage: POST body:{"message":"Hello World!","rooms":["#room1","#room2"]}')}
	} else {res.sendFile(require('path').join(__dirname,'client.html'))}
});
app.use('*', function(req, res) {res.sendStatus(404)});
server.listen(config.socket_server_port||3000,()=>{console.log(new Date().toISOString()+' | SERVER STARTED, PORT: '+(config.socket_server_port||3000))});

const own_client_socket = require('socket.io-client')(config.socket_server_URL);
own_client_socket.emit('info','Listening to '+config.socket_server_URL+'/m/[messagetext] and posting to #broadcast.');
own_client_socket.emit('leave','#broadcast');

io.on('connection', (socket) => {
	let ip=socket['handshake']['headers']["x-real-ip"];
	socket.emit('message','WELCOME #'+io.engine.clientsCount+(ip?' ('+ip+')':''));
	socket.join('#broadcast');
	socket.data={};
	socket.on('name', (name) => {socket.data.name=safe_text(name); socket.emit('message','You are now known as '+socket.data.name+'.')});
	socket.on('info', (info) => {socket.data.info=safe_text(info); socket.emit('message','Your info is: '+socket.data.info)});
	socket.on('join', (room) => {socket.join(room); socket.emit('message','You are joining '+room+' now.')});
	socket.on('leave', (room) => {socket.leave(room); socket.emit('message','You left '+room+'.')});
	socket.on('message', (msg,meta) => {
		// handle command
		if (/^\//i.test(msg)) {handle_command(socket,msg,meta)} 
		// forward message to other clients
		else if (msg) {forward_message(socket,msg,meta)};
	});
});

async function fetchSockets(callback) {callback(await io.fetchSockets())}
function safe_text(text) {if (text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,256)} else {return undefined}}

function handle_command(socket,msg,meta) {
	//if (/^\/restart$/i.test(msg)) {socket.emit('message','Ok. Restarting.');setTimeout(function(){process.exit()},3000)}
	if (/^\/help/i.test(msg)) {socket.emit('message','help: /nick [name] | /join [room] | /leave [room] | /rooms | /users | /whois [name] | /m [room] [message] | /kick [id]')}
	if (/^\/(rooms|r)$/i.test(msg)) {socket.emit('message','You are joining these rooms: '+JSON.stringify([...socket.rooms]))}
	if (/^\/(users|u)$/i.test(msg)) {
		fetchSockets((s)=>{ 
			let s2=s.map((e)=>{
				e.data.network={address:e['handshake']['headers']["x-real-ip"],port:e['handshake']['headers']["x-real-port"],host:e.handshake.headers.host,referer:e.handshake.headers.referer,useragent:e['handshake']['headers']['user-agent']};
				return {id:e.id,rooms:[...e.rooms].slice(1),data:e.data}
			}); 
			socket.emit('message',s2.length+' users online: '+JSON.stringify(s2));
		})
	}
	let name=(/^\/(name|nick|n)\ ([^\ ]*)$/i.exec(msg)); if (name) {socket.data.name=safe_text(name[2]); socket.emit('message','You are now known as '+socket.data.name+'.')};
	let join=(/^\/(join|j)\ ([^\ ]*)$/i.exec(msg)); if (join) {socket.join(join[2]); socket.emit('message','You are joining '+join[2]+' now.')};
	let leave=(/^\/(leave|l)\ ([^\ ]*)$/i.exec(msg)); if (leave) {socket.leave(leave[2]); socket.emit('message','You left '+leave[2]+'.')};
	let whois=(/^\/(whois|w)\ ([^\ ]*)$/i.exec(msg)); if (whois) {
		fetchSockets((s)=>{ 
			let s2=s.filter((e)=>{return e.data.name==whois[2]}).map((e)=>{
				e.data.network={address:e['handshake']['headers']["x-real-ip"],port:e['handshake']['headers']["x-real-port"],host:e.handshake.headers.host,referer:e.handshake.headers.referer,useragent:e['handshake']['headers']['user-agent']};
				return {id:e.id,rooms:[...e.rooms].slice(1),data:e.data}
			});
			socket.emit('message',s2.length+' users online with name '+whois[2]+': '+JSON.stringify(s2));
		})
	};
	let kick=(/^\/(kick|k)\ ([^\ ]*)$/i.exec(msg)); if (kick) {
		fetchSockets((s)=>{ 
			let s2=s.find((e)=>{return e.id==kick[2]});
			if (s2) {
				socket.emit('message','You kicked user '+kick[2]+'.');
				// leave all rooms (including his own "private"-room)
				[...s2.rooms].forEach((r)=>{s2.leave(r)});
				s2.emit('message','You got kicked!');
				//s2.disconnect(true);
			}
		})
	};
	let message_to_room=(/^\/(message|m)\ ([^\ ]*)\ (.*)$/i.exec(msg)); if (message_to_room&&message_to_room[3]) {
		forward_message(socket,message_to_room[3],{rooms:[safe_text(message_to_room[2])]});
	};
}

function forward_message(socket,msg,meta) {
	// if no rooms are given in meta, set rooms to all rooms the sender is joining (except his own "private"-room (=socket.id))
	if ( !((meta&&meta.rooms) && (Array.isArray(meta.rooms)) && (meta.rooms.length>0)) ) {
		meta=meta||{};
		meta.rooms=[...socket.rooms].filter((r)=>{return r!==socket.id});
	}
	if (meta.rooms.length>0) {
		if (flood_protect(socket)) {
			// send message
			let ioto=io; 
			meta.rooms.forEach((r)=>{ioto=ioto.to(r)});
			ioto.emit('message',safe_text(msg),{sender:socket.id,name:safe_text(socket.data.name),rooms:meta.rooms});
		} else {
			// send flood-protect-message to user
			socket.emit('message','Easy there, Turbo. Too many requests recently. Enhance your calm. (credit: '+socket.data.floodprotect.credit+')');
		}
	}
}

function flood_protect(socket) {
	let fp=socket.data.floodprotect||{};
	let t=new Date().getTime();
	fp.timestamp=fp.timestamp||t;
	fp.cost=fp.cost||5;
	fp.credit=Math.max(  Math.min( (fp.credit||100) + Math.floor((t-fp.timestamp)/1000) - fp.cost , 100)  , -100);
	fp.timestamp=t;
	socket.data.floodprotect=fp;
	return (fp.credit>0);
}	
