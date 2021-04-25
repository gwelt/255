var config = require('./config.json');
exports.startSocket = function (myname,messagehandler) {

  const socket = require('socket.io-client')('http://'+config.socket_server+':'+config.socket_server_port||'3000');

  socket.on('connect', function(){console.log(new Date().toISOString()+' | '+myname+' connected')});
  socket.on('message', 
    function(data){
      if (!data.startsWith('('+myname+')')) {
        messagehandler(data,(reply)=>{socket.emit('message','('+myname+') '+reply)})
      }
    }
  );
  //socket.on('disconnect', function(e) {setTimeout(function(){ process.exit(); },60000)});

  return socket;
};
