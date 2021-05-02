var config = require('./config.json');
const socket = require('socket.io-client')(config.socket_server_URL);

socket.on('connect', function() {
	console.log(new Date().toISOString()+' | '+socket.id)
	socket.emit('name','API_rki');
	socket.emit('info','Polling corona-numbers from rki.de and serving them as JSON via private message. Usage: /m #API_rki [request]');
	socket.emit('leave','#broadcast');
	socket.emit('join','#API_rki');
});

socket.on('message', function(msg,meta) {
	if (/^numbers$/i.test(msg)) {socket.emit('message','API_rki is not available. Try again later, '+((meta&&meta.name)?meta.name:'unnamed user')+'.',{rooms:[(meta?meta.sender:undefined)]})}
	else {socket.emit('message','Usage: ...',{rooms:[(meta?meta.sender:undefined)]})};		
});

check_RKI_data(); // check RKI-data at startup
setInterval(function(){check_RKI_data()},6*60*60*1000); // and then check RKI-data every 6 hours

function check_RKI_data() {
	// request data from RKI
	// check for updated data
	// add data to local object memory store
}
