var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('Mathbot',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
function messagehandler(data,sayit) {
  if (/--status/i.test(data)) {sayit('at your service')}
  if (/--help/i.test(data)) {sayit('help: fib [1-999]')}
  var d=(/fib\ ?(\d{1,3})$/i.exec(data)); if (d) {sayit('fib('+d[1]+')='+fib(d[1]))};
}
function fib(n) {var r=0, a=0, b=1; for(var i=0;i<n;i++) {r=a+b; if (i>0) {a=b}; b=r;} return r}
