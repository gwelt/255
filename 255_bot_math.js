const webSocket = require('./255_ws_module').startWebsocket('Mathbot',(msg,callback)=>messagehandler(msg,callback));
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say('at your service')}
  if (/--help/i.test(data)) {say('help: fib [1-999]')}
  var d=(/fib\ ?(\d{1,3})$/i.exec(data)); if (d) {say('fib('+d[1]+')='+fib(d[1]))};
}
function fib(n) {var r=0, a=0, b=1; for(var i=0;i<n;i++) {r=a+b; if (i>0) {a=b}; b=r;} return r}
