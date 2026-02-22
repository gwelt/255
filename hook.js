module.exports = Hook;
var config = require('./config.json');

function Hook () {}

Hook.prototype.sendMessage = function (msg,rooms) {
	// SEND TO 255 - via POST-request
	let body = { message: msg, rooms: rooms }; // rooms = e.g. ['printer']
	const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	fetch((config.server_URL||'http://localhost')+'/255', {
		method: 'post',
		body:    JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' }
	})
	.catch(err => {console.error(err); return;})
	.then(res => res.text())
	.then(text => {}); //console.log('RESPONSE: '+text)
}

Hook.prototype.sendMessageSocket = function (msg,rooms) {
	// SEND TO 255 - opening a socket
	const socket = require('socket.io-client')(config.socket_server_URL||'http://localhost:3000');
	socket.on('connect', function() {
		socket.emit('message',msg,{rooms:rooms}); // rooms = e.g. ['printer']
		setTimeout(function(){socket.disconnect()},500);
	});
}

Hook.prototype.sendToDisk = function (diskid,msg) {
	// SEND TO DISK
	let body = {diskid:diskid,command:'write',block:msg};
	const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	fetch((config.server_URL||'http://localhost')+'/disk/', {
		method: 'post',
		body:    JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' }
	})
	.catch(err => {console.error(err); return;})
	.then(res => res.text())
	.then(text => {}); //console.log('RESPONSE: '+text)
}
