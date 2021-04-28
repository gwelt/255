var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id)
	socket.emit('name','ping');
	socket.emit('info','Sending a message to room #ping every 5 seconds. Usage: /m #ping ping');
	socket.emit('leave','#broadcast');
	socket.emit('join','#ping');
});

socket.on('message', function(msg,meta) {
	if (/^--status$/i.test(msg)) {socket.emit('message','pinging')}
	//if (/^--status$/i.test(msg)) {socket.emit('message','pinging',{rooms:[(meta?meta.sender:undefined)]})}
	if (/^ping$/i.test(msg)) {socket.emit('message','Pong to you, '+((meta&&meta.name)?meta.name:'unnamed user')+'.',{rooms:[(meta?meta.sender:undefined)]})}
});

setInterval(function(){
	socket.volatile.emit('message',new Date().toISOString());
},5000);
