const fetch = require('node-fetch');
fetch('http://localhost:3000/', {
	method: 'post',
	body:    JSON.stringify({ message: 'Hello World!', rooms: ['#broadcast','#test']}),
	headers: { 'Content-Type': 'application/json' }
});
