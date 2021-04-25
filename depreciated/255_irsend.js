var global_say=()=>{};
const socket = require('./255_socket_client_module').startSocket('IRbot',(msg,callback)=>{global_say=callback;messagehandler(msg,callback)});
function messagehandler(data,say) {
  if (/--status/i.test(data)) {say('at your service')}
  if (/--help/i.test(data)) {say('help: irsend disco/ice up/stop/down/1/2/3/4/5')}
  if (/irsend disco/i.test(data)) {say('Disco! '+require('child_process').execSync('irsend SEND_ONCE DISCO KEY_POWER',{stdio:'pipe'}))}
  if (/irsend ice up/i.test(data)) {say('ICE UP '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_UP',{stdio:'pipe'}))}
  if (/irsend ice stop/i.test(data)) {say('ICE STOP '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_STOP',{stdio:'pipe'}))}
  if (/irsend ice down/i.test(data)) {say('ICE DOWN '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_DOWN',{stdio:'pipe'}))}
  if (/irsend ice 1/i.test(data)) {say('ICE KEY_1 '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_1',{stdio:'pipe'}))}
  if (/irsend ice 2/i.test(data)) {say('ICE KEY_2 '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_2',{stdio:'pipe'}))}
  if (/irsend ice 3/i.test(data)) {say('ICE KEY_3 '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_3',{stdio:'pipe'}))}
  if (/irsend ice 4/i.test(data)) {say('ICE KEY_4 '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_4',{stdio:'pipe'}))}
  if (/irsend ice 5/i.test(data)) {say('ICE KEY_5 '+require('child_process').execSync('irsend SEND_ONCE ICE KEY_5',{stdio:'pipe'}))}
}
