var i2c = require('i2c');
var sleep = require('sleep');

var displayPorts = {
	RS : 0x01,
	E : 0x04,
	D4 : 0x10,
	D5 : 0x20,
	D6 : 0x40,
	D7 : 0x80,
	CHR : 1,
	CMD : 0,
	backlight : 0x08,
	RW : 0x20 // not used
};

var LCD = function (device, address) {
	this.i2c = new i2c(address, {
			device : device
		});

	this.write4(0x30, displayPorts.CMD); //initialization
	this._sleep(200);
	this.write4(0x30, displayPorts.CMD); //initialization
	this._sleep(100);
	this.write4(0x30, displayPorts.CMD); //initialization
	this._sleep(100);
	this.write4( LCD.FUNCTIONSET | LCD._4BITMODE | LCD._2LINE | LCD._5x10DOTS, displayPorts.CMD); //4 bit - 2 line 5x7 matrix
	
	this._sleep(10);
	this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON, displayPorts.CMD); //turn cursor off 0x0E to enable cursor
	this._sleep(10);
	this.write(LCD.ENTRYMODESET | LCD.ENTRYLEFT, displayPorts.CMD); //shift cursor right
	this._sleep(10);
	this.write(LCD.CLEARDISPLAY, displayPorts.CMD); // LCD clear

	this.createChar( 0,[ 0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F] );
    this.createChar( 1,[ 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00] );

	return this;
}

// commands
LCD.CLEARDISPLAY = 0x01;
LCD.RETURNHOME = 0x02;
LCD.ENTRYMODESET = 0x04;
LCD.DISPLAYCONTROL = 0x08;
LCD.CURSORSHIFT = 0x10;
LCD.FUNCTIONSET = 0x20;
LCD.SETCGRAMADDR = 0x40;
LCD.SETDDRAMADDR = 0x80;

//# flags for display entry mode
LCD.ENTRYRIGHT = 0x00;
LCD.ENTRYLEFT = 0x02;
LCD.ENTRYSHIFTINCREMENT = 0x01;
LCD.ENTRYSHIFTDECREMENT = 0x00;

//# flags for display on/off control
LCD.DISPLAYON = 0x04;
LCD.DISPLAYOFF = 0x00;
LCD.CURSORON = 0x02;
LCD.CURSOROFF = 0x00;
LCD.BLINKON = 0x01;
LCD.BLINKOFF = 0x00;

//# flags for display/cursor shift
LCD.DISPLAYMOVE = 0x08;
LCD.CURSORMOVE = 0x00;
LCD.MOVERIGHT = 0x04;
LCD.MOVELEFT = 0x00;

//# flags for function set
LCD._8BITMODE = 0x10;
LCD._4BITMODE = 0x00;
LCD._2LINE = 0x08;
LCD._1LINE = 0x00;
LCD._5x10DOTS = 0x04;
LCD._5x8DOTS = 0x00;

LCD.prototype._sleep = function (milli) {
	sleep.usleep(milli * 1000);
};

LCD.prototype.write4 = function (x, c) {
	function err() {};
	var a = (x & 0xF0); // Use upper 4 bit nibble
	this.i2c.writeByte(a | displayPorts.backlight | c, err);
	this.i2c.writeByte(a | displayPorts.E | displayPorts.backlight | c, err);
	this.i2c.writeByte(a | displayPorts.backlight | c, err);
	this._sleep(1);
}

LCD.prototype.write = function (x, c) {
	this.write4(x, c);
	this.write4(x << 4, c);
	this._sleep(1);
	return this;
}

LCD.prototype.clear = function () {
	return this.write(LCD.CLEARDISPLAY, displayPorts.CMD);
}

LCD.prototype.print = function (str) {
	if (typeof str == 'string') {
		for (var i = 0; i < str.length; i++) {
			var c = str[i].charCodeAt(0);
			this.write(c, displayPorts.CHR);
			this._sleep(1);
		}
	}
	return this;
}

/** set cursor pos, top left = 0,0 */
LCD.prototype.setCursor = function (x, y) {
	var l = [0x00, 0x40, 0x14, 0x54];
	return this.write(LCD.SETDDRAMADDR | (l[y] + x), displayPorts.CMD);
}

/** Turn display off */
LCD.prototype.off = function () {
	displayPorts.backlight = 0x00;
	return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYOFF, displayPorts.CMD);
}
/** Turn display on */
LCD.prototype.on = function () {
	displayPorts.backlight = 0x08;
	return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON, displayPorts.CMD);
}

/** set special character 0..7, data is an array(8) of bytes, and then return to home addr */
LCD.prototype.createChar = function (ch, data) {
	this.write(LCD.SETCGRAMADDR | ((ch & 7) << 3), displayPorts.CMD);
	for (var i = 0; i < 8; i++)
		this.write(data[i], displayPorts.CHR);
	return this.write(LCD.SETDDRAMADDR, displayPorts.CMD);
}

var interval;
LCD.prototype.print_delayed = function (str,delay) {
    if (typeof str == 'string') {
        clearInterval(interval);
        lcd=this;
        lcd.write(LCD.CLEARDISPLAY,0);
        var i=0;
        interval=setInterval(function(){
            if (i<32)
            {
              	var c = 1; if (i<str.length) {c=str[i].charCodeAt(0)};
              	var y=Math.floor(i/16);			
	  	     	lcd.setCursor(i%16,y); lcd.write(c,1);
				i++;
            } else {clearInterval(interval)}
        }, delay);
    }
    return 1;
}

LCD.prototype.print_starter = function (times,delay) {
  this.write(LCD.CLEARDISPLAY,0);
  for (var i=0; i<times; i++) {
    this.setCursor(0,0); this.write(0,1); this._sleep(delay);
    this.setCursor(0,0); this.write(1,1); this._sleep(Math.floor(delay/2));
  }
  return;
}

module.exports = LCD;

var lcd_device = new LCD('/dev/i2c-1', 0x27);
var timeout;
process.on('message', (m) => {
    clearTimeout(timeout);
    //setTimeout(function(){ 
      lcd_device.on();
      lcd_device.print_starter(1,300);
      var delay=80;
      if (lcd_device.print_delayed(m,delay)) {timeout=setTimeout(function(){ lcd_device.off() }, 32*delay+60000)}
    //}, 0);
});
