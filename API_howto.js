// use the API and send a POST-request
const fetch = require('node-fetch')('http://localhost:3000/', {
	method: 'post',
	body:    JSON.stringify({ message: 'Hello World via API!', rooms: ['#broadcast','#test']}),
	headers: { 'Content-Type': 'application/json' }
});

// or open a socket - and close it after sending your message
const socket = require('socket.io-client')('http://localhost:3000');
socket.on('connect', function() {
	socket.emit('message','Hello World via socket!',{rooms:['#broadcast','#test']});
	setTimeout(function(){socket.disconnect()},100);
});
