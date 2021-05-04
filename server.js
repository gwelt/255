'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config.json');
const default_room = '#broadcast';

app.use(bodyParser.json({ strict: true }));
app.use(function (error, req, res, next){next()}); // don't show error-message, if it's not JSON ... just ignore it
app.use(bodyParser.urlencoded({ extended: true }));
app.use('(/255)?/m/:m', function(req, res) { // 
	if (req.params.m) {own_client_socket.emit('message',req.params.m,{rooms:[default_room]})};
	res.send('ok');
})
app.use(/^\/(255)?$/, function(req, res) {
	if ((req.method=='POST')&&(req.body)) {
		if (req.body.message) {
			own_client_socket.emit('message',req.body.message,{rooms:(Array.isArray(req.body.rooms)?req.body.rooms:[default_room])});
			res.send('ok');
		} else {res.send('usage: POST body:{"message":"Hello World!","rooms":["#room1","#room2"]}')}
	} else {res.sendFile(require('path').join(__dirname,'client.html'))}
})
app.use('*', function(req, res) {res.sendStatus(404)});
server.listen(config.socket_server_port||3000,()=>{console.log(new Date().toISOString()+' | SERVER STARTED, PORT: '+(config.socket_server_port||3000))});

const own_client_socket = require('socket.io-client')(config.socket_server_URL);
own_client_socket.emit('info','Listening to https://[this_server]/m/[messagetext] and posting to '+default_room+'.');

io.on('connection', (socket) => {
	let ip=socket['handshake']['headers']["x-real-ip"];
	socket.emit('message','WELCOME #'+io.engine.clientsCount+(ip?' ('+ip+')':''));
	//socket.join(default_room);
	socket.data={};
	socket.data.network={address:socket['handshake']['headers']["x-real-ip"],port:socket['handshake']['headers']["x-real-port"],host:socket.handshake.headers.host,referer:socket.handshake.headers.referer,useragent:socket['handshake']['headers']['user-agent']};
	socket.on('name', (name) => {socket.data.name=safe_text(name); socket.emit('message','You are now known as '+socket.data.name+'.')});
	socket.on('info', (info) => {socket.data.info=safe_text(info); socket.emit('message','Info: '+socket.data.info)});
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
function safe_text(text) {if (text) {return unescape(text).replace(/[^\w\s\däüöÄÜÖß\.,'"!\@#$^&%*()\+=\-\[\]\/{}\|:\?]/g,'').slice(0,10240)} else {return undefined}}

function handle_command(socket,msg,meta) {
	//if (/^\/restart$/i.test(msg)) {socket.emit('message','Ok. Restarting.');setTimeout(function(){process.exit()},3000)}
	if (/^\/help/i.test(msg)) {socket.emit('message','help: /nick [name] | /join [room] | /leave [room] | /rooms ([room]) | /users | /whois [name] | /m [room] [message] | /kick [id]')}
	let name=(/^\/(name|nick|n)\ ([^\ ]*)$/i.exec(msg)); if (name) {socket.data.name=safe_text(name[2]); socket.emit('message','You are now known as '+socket.data.name+'.')};
	let join=(/^\/(join|j)\ ([^\ ]*)$/i.exec(msg)); if (join) {socket.join(join[2]); socket.emit('message','You are joining '+join[2]+' now.')};
	let leave=(/^\/(leave|l)\ ([^\ ]*)$/i.exec(msg)); if (leave) {socket.leave(leave[2]); socket.emit('message','You left '+leave[2]+'.')};
	let users=(/^\/(users|u|whois|w|allusers)\ ?([^\ ]*)?$/i.exec(msg)); if (users) {
		fetchSockets((s)=>{ 
			let s2=s.filter((e)=>{return (users[2]==undefined)||(e.data.name==users[2])||(e.id==users[2])}).map((e)=>{
				return {id:e.id,rooms:[...e.rooms].filter((e)=>{return e.startsWith('#')}),data:e.data}
			});
			if (users[2]) {
				socket.emit('message',s2.length+' users online'+(users[2]?' with name|id '+users[2]:'')+': '+JSON.stringify(s2));
			} else if (users[1]=='allusers') {
				socket.emit('message',s2.length+' users online: '+JSON.stringify(s2));
			} else {
				let me='You are: '+socket.data.name+' | '+socket.id;
				let all_users_ids=s2.length+' users in total.'; //: '+s2.map((e)=>{return e.id}).join(', ');
				let humans=s2.filter((e)=>{return e.data.name&&!e.data.info}).sort((a,b)=>{if (a.data.name>b.data.name){return 1} if (b.data.name>a.data.name){return -1} return 0});
				humans=(humans.length?humans.length:'No')+' users with a meaningful name'+(humans.length?': ':'.')+humans.map((e)=>{return e.data.name}).join(', ');
				let services=s2.filter((e)=>{return e.data.info}).sort((a,b)=>{if (a.data.name>b.data.name){return 1} if (b.data.name>a.data.name){return -1} return 0});
				services=(services.length?services.length:'No')+' services'+(services.length?': ':'.')+services.reduce((a,c)=>{return a+'\n'+c.data.name+' | '+c.data.info},'');
				socket.emit('message',me+'\n'+all_users_ids+'\n'+humans+'\n'+services);
			}
		})
	};
	let rooms=(/^\/(rooms|r)\ ?([^\ ]*)?$/i.exec(msg)); if (rooms) {
		if (rooms[2]==undefined) {
			let joining = 'You are joining these rooms: '+[...socket.rooms].join(', ');
			let all_public_rooms = 'All public rooms: '+[...io.sockets.adapter.rooms].map((e)=>{return e[0]}).filter((e)=>{return e.startsWith('#')}).sort().join(', ');
			socket.emit('message',joining+'\n'+all_public_rooms);
		} else {
			fetchSockets((s)=>{ 
				let s2=s.filter((e)=>{return (e.rooms.has(rooms[2]))}).map((e)=>{
					return {id:e.id,rooms:[...e.rooms].filter((e)=>{return e.startsWith('#')}),data:e.data}
				}); 
				let all_users_ids=s2.length+' users in room '+rooms[2]+'.'; //+': '+s2.map((e)=>{return e.id}).join(', ');
				let humans=s2.filter((e)=>{return e.data.name&&!e.data.info}).sort((a,b)=>{if (a.data.name>b.data.name){return 1} if (b.data.name>a.data.name){return -1} return 0});
				humans=(humans.length?humans.length:'No')+' users with a meaningful name'+(humans.length?': ':'.')+humans.map((e)=>{return e.data.name}).join(', ');
				let services=s2.filter((e)=>{return e.data.info}).sort((a,b)=>{if (a.data.name>b.data.name){return 1} if (b.data.name>a.data.name){return -1} return 0});
				services=(services.length?services.length:'No')+' services'+(services.length?': ':'.')+services.reduce((a,c)=>{return a+'\n'+c.data.name+' | '+c.data.info},'');
				socket.emit('message',all_users_ids+'\n'+humans+'\n'+services);
				//socket.emit('message',s2.length+' users in room '+rooms[2]+': '+JSON.stringify(s2));
			})
		}
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
	// if no rooms are given in meta, send to default_room only
	if ( !((meta&&meta.rooms) && (Array.isArray(meta.rooms)) && (meta.rooms.length>0)) ) {
		meta=meta||{};
		meta.rooms=[default_room];
	}
	if (meta.rooms.length>0) {
		if (flood_protect(socket)) {
			// send message
			let ioto=io; 
			meta.rooms.forEach((r)=>{ioto=ioto.to(r)});
			ioto.emit('message',safe_text(msg),{sender:socket.id,name:safe_text(socket.data.name),rooms:meta.rooms.filter((e)=>{return e.startsWith('#')})});
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
	fp.credit=Math.max(  Math.min( (fp.credit||(100+fp.cost)) + Math.floor((t-fp.timestamp)/1000) - fp.cost , 100)  , -100);
	fp.timestamp=t;
	socket.data.floodprotect=fp;
	return (fp.credit>0);
}	
