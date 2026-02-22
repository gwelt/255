/* see //var/www/html/led.js for original */
/*
// include <script src='led.js'></script> and <div id='ledbar'></div> in you HTML to spawn ledbar there
// to test, try console: ledBar.rainbowLED()
*/
if (typeof module!=='undefined') {module.exports = LEDbar} else {var ledBar = new LEDbar()}

/* ================================================================= */
/* === LED-BAR ===================================================== */
/* ================================================================= */
function LEDbar(ws281x) {
  this.NUM_LEDS = 12;
  if (typeof ws281x!=='undefined') {
    this.ws281x = ws281x;
    this.ws281x.init(this.NUM_LEDS);
  }
  this.pixelOverlay = [];
  this.pixelZooLayer = [];
  this.pixelBackground = [];
  this.pixelZoo = new PixelZoo(this);
  this.current_color='102040';
  this.reverse=false;
  this.actions=[
    ['rainbow',()=>{this.rainbowLED(undefined,4,80)}],
    ['blink',()=>{this.blinkLED(this.current_color)}],
    ['sparkle',()=>{this.sparkle()}]
  ];
  this.default_action=this.actions[1][1];
  setTimeout(()=>{
    this.spawn_HTML_leds_in_ledbar_div();
    this.push_pixelBackground(this.current_color,this.NUM_LEDS);
  },250);
  return this;
}

LEDbar.prototype.spawn_HTML_leds_in_ledbar_div = function() {
  if (typeof document!=='undefined') {
    let b=document.getElementById('ledbar');
    if (b) {
      b.style.backgroundColor='#000000';
      b.style.height='2rem';
      b.style.padding='.5rem 0 .5rem 0';
      b.style.display='flex';
      b.style.justifyContent='space-evenly';
      for(var i=0;i<this.NUM_LEDS;i++) {
        let e=document.createElement('div');
        e.id='led'+(this.NUM_LEDS-1-i); 
        e.style.width=(100/this.NUM_LEDS)*0.8+'%';
        e.style.backgroundColor='#000000';
        b.appendChild(e);
      }
    }
  }
}

LEDbar.prototype.render = function() {
  // pixelOverlay over pixelZooLayer over pixelBackground => pixelShow
  let pixelShow = [];
  for(var i=0;i<this.NUM_LEDS;i++) {pixelShow[i]=this.pixelOverlay[i]||(this.pixelZooLayer[i]||this.pixelBackground[i])}
  // update hardware leds
  if (typeof this.ws281x!=='undefined') {
    let uint32a=new Uint32Array(this.NUM_LEDS); 
    uint32a=pixelShow.map(p=>hex2Int(p)).slice();
    this.ws281x.render(uint32a);
  }
  // update software leds
  if (typeof document!=='undefined') {
    let a=pixelShow.map(p=>extractColorNumber(p));
    for(var i=0;i<a.length;i++) {
      if (document.getElementById('led'+i)) {document.getElementById('led'+i).style.backgroundColor='#'+a[i];}
    }
  }
}

LEDbar.prototype.set_pixelOverlay = function(pos,color) {
  if (0<=pos<this.NUM_LEDS) {
    this.pixelOverlay[pos]=color;
    this.render();
  }
}

LEDbar.prototype.set_pixelZooLayer = function(pos,color) {
  if (0<=pos<this.NUM_LEDS) {
    this.pixelZooLayer[pos]=color;
    this.render();
  }
}

LEDbar.prototype.push_pixelBackground = function(colorcode,length,reverse) {
  if (reverse) {this.pixelBackground.reverse()}
  for(var i = 1; i <= this.NUM_LEDS; i++) {
    this.pixelBackground[this.NUM_LEDS-i] = ((this.NUM_LEDS-i-length)>=0)?this.pixelBackground[this.NUM_LEDS-i-length]:colorcode;
  }
  if (reverse) {this.pixelBackground.reverse()}
  this.render();
}

LEDbar.prototype.push_pixelBackground_array = function(color_array,delay,reverse) {
  if (reverse===undefined) {this.reverse=!this.reverse}
  clearInterval(this.animation);
  var counter=0;
  delay = delay||25;
  this.animation = setInterval(()=>{
    if (counter<color_array.length+this.NUM_LEDS) {
      this.push_pixelBackground(color_array[counter]||this.current_color,1,this.reverse);
    } else {
      clearInterval(this.animation);
    }
    counter++;
  },delay);
}

LEDbar.prototype.set_default_action = function(action_name) {
  let da=this.actions.find((a)=>a[0]==action_name);
  if (da) {this.default_action=da[1]; this.default_action(); return da[0]} else {return false}
}

/* ================================================================= */
/* === LED-BAR FUNCTIONS =========================================== */
/* ================================================================= */
LEDbar.prototype.show_info = function(color) {
  this.set_pixelOverlay(0,color);
  this.set_pixelOverlay(this.NUM_LEDS-1,color);
}

LEDbar.prototype.blinkLED = function(col,reverse) {
  this.current_color=col||randCol(); //this.current_color;
  this.push_pixelBackground_array(['303030',,'808080',,'303030'],50,reverse);
}

LEDbar.prototype.fadeLED = function(to,from,steps,delay,reverse) {
  from = from||this.current_color;
  this.current_color = to||randCol();
  this.push_pixelBackground_array(calc_fade(to,from,steps),delay,reverse);
}

LEDbar.prototype.rainbowLED = function(rainbow_color_array,steps,delay,reverse) {
  rainbow_color_array=rainbow_color_array||['#ff0000','#00ff00','#0000ff','#ff0000','#00ff00','#0000ff','#ff0000','#00ff00','#0000ff'];
  rainbow_color_array.push(this.current_color);
  let rainbow_color_fade_array=[];
  let from=this.current_color;
  while (rainbow_color_array.length>0) {
    let to=rainbow_color_array.shift();
    rainbow_color_fade_array.push(...calc_fade(to,from,(steps||40)));
    from=to;
  }
  this.push_pixelBackground_array(rainbow_color_fade_array,delay,reverse);
}

LEDbar.prototype.party = function(seconds) {
  this.rainbowLED(undefined,seconds||20,90);
  this.sparkle(seconds||20);
}

LEDbar.prototype.addPixel = function(col,pos,ttl) {
  return this.pixelZoo.add(col,pos,ttl);
}

LEDbar.prototype.zoo = function(seconds) {
  if (seconds) {
    if (seconds<=1) {
      if (seconds==0) {
        this.pixelZoo.close();
      } else {
        if (this.pixelZoo.pixels.length) {this.pixelZoo.pixels[this.pixelZoo.pixels.length-1].delete()}
      }
    } else {
      this.addPixel(undefined,undefined,seconds*1000).move((idontcare()?1:-1),(idontcare()?true:false),Math.random()*12);
    }
  } else {
    for(var i=0;i<3;i++) {this.addPixel(undefined,undefined,3600000).move((idontcare()?1:-1),(idontcare()?true:false),Math.random()*12)} // 1 hour
  }
}

LEDbar.prototype.sparkle_for_one_second = function(sparcs_per_second,average_duration_ms) {
  for(var i=1;i<sparcs_per_second;i++) {
    setTimeout(()=>{
      let ttl=Math.round(Math.random()*average_duration_ms);
      if (ttl>0) {this.pixelZoo.add('#ffffff',Math.floor(Math.random()*this.NUM_LEDS),ttl)}
    },(i==1)?0:Math.round(Math.random()*1000));
  }
}

LEDbar.prototype.sparkle = function(seconds,sparcs_per_second,average_duration_ms) {
  clearInterval(this.sparkle_animation);
  seconds = seconds||2;
  sparcs_per_second = sparcs_per_second||30;
  average_duration_ms = average_duration_ms||30;
  this.sparkle_for_one_second(sparcs_per_second,average_duration_ms);
  this.sparkle_animation = setInterval(()=>{
    if (seconds>1) {
      this.sparkle_for_one_second(sparcs_per_second,average_duration_ms);
      seconds--;
    } else {
      clearInterval(this.sparkle_animation);
    }
  },1000);
}

LEDbar.prototype.show_info_animation = function(color,animation_duration_sec) {
  this.addPixel(color,-1,(animation_duration_sec||4)*1000).tiptoe(2);
}

/* ================================================================= */
/* === ZOO ========================================================= */
/* ================================================================= */
function PixelZoo(ledBar) {
  this.ledBar = ledBar;
  this.pixels = [];
}

PixelZoo.prototype.add = function(col,pos,ttl) {
  let pixel=new Pixel(col,pos,ttl,this);
  this.pixels.push(pixel);
  this.update_pos(pixel.pos);
  return pixel;
}

PixelZoo.prototype.delete = function(pixel) {
  let pp=pixel.pos;
  let i=this.pixels.indexOf(pixel); if (i>-1) {this.pixels.splice(i,1)} //this.pixels=this.pixels.filter(p=>p!==pixel);
  this.update_pos(pp);
}

PixelZoo.prototype.close = function() {
  while (this.pixels.length) {this.pixels[0].delete()}
}

PixelZoo.prototype.update_pos = function(pos) {
  let p=this.pixels.filter(p=>p.pos==pos).sort((a,b)=>b.ts-a.ts)[0];
  let col=p?p.col:undefined;
  this.ledBar.set_pixelZooLayer(pos,col);
}

/* === PIXEL ======================================================= */
function Pixel(col,pos,ttl,zoo) {
  this.zoo = zoo;
  this.set_col(col);
  this.set_pos(pos);
  this.set_ttl(ttl);
}

Pixel.prototype.set_col = function(col) {this.col=col||randCol();this.zoo.update_pos(this.pos);}
Pixel.prototype.set_pos = function(pos) {this.pos=pos||(this.zoo?Math.floor(Math.random()*this.zoo.ledBar.NUM_LEDS):0);this.zoo.update_pos(this.pos);}
Pixel.prototype.set_ttl = function(ttl) {if (ttl) {setTimeout(()=>{this.delete()},ttl)}}

Pixel.prototype.start = function(speed) {this.stop(); if (this.f) {this.f()}; this.interval=setInterval((this.f)||(()=>{}),Math.ceil(1000/(speed||1)))}
Pixel.prototype.stop = function() {clearInterval(this.interval)}
Pixel.prototype.delete = function() {this.stop(); this.zoo.delete(this)}

Pixel.prototype.step = function() {
  let oldpos = this.pos;
  this.pos = this.pos + (this.distance||1);
  if (this.circular) {    
    if (this.pos<0) {this.pos=(this.zoo.ledBar.NUM_LEDS)-1}
    if (this.pos>(this.zoo.ledBar.NUM_LEDS)-1) {this.pos=0}
  } else {
    if (this.pos<=0) {this.distance=1}
    if (this.pos>=(this.zoo.ledBar.NUM_LEDS)-1) {this.distance=-1}
  }
  this.ts = new Date();
  this.zoo.update_pos(this.pos);
  this.zoo.update_pos(oldpos);
}

Pixel.prototype.move = function(distance,circular,speed) {
  this.distance = distance;
  this.circular = circular;
  this.f=()=>{this.step()};
  this.start(speed);
}

Pixel.prototype.tiptoe = function(speed) {
  this.f=()=>{
    let o=this.pos; 
    let m=this.zoo?Math.floor((this.zoo.ledBar.NUM_LEDS-1)/2):0;
    (this.pos==m)?this.set_pos(m+1):this.set_pos(m); 
    this.zoo.update_pos(o);
  };
  this.start(speed);
}

/* ================================================================= */
/* === HELPERS ===================================================== */
/* ================================================================= */
function idontcare() {return Math.random()<0.5};
function rgb2Int(r, g, b) {return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff)}
function hex2Int(hex) {var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? rgb2Int(parseInt(result[1],16),parseInt(result[2],16),parseInt(result[3],16)) : null;}
function extractColorNumber(col) {var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(col); return result ? result[1]+result[2]+result[3] : null;}
function randCol() {var c='0123456789ABCDEF'; var r=''; for (var i=0;i<6;i++) {r+=c[Math.floor(Math.random()*16)];} return r;}
function calc_fade(to,from,steps) {
  function rgbsplit(colorcode) {let r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorcode); return [,parseInt(r[1],16)&0xff,parseInt(r[2],16)&0xff,parseInt(r[3],16)&0xff];}
  from = rgbsplit(from||current_color);
  to = rgbsplit(to);
  steps = steps || 40;
  let fade_array = [];
  fade_array.push('#'+from[1].toString(16).padStart(2,'0')+from[2].toString(16).padStart(2,'0')+from[3].toString(16).padStart(2,'0'));
  while (steps>0) {
    let i=1; while (i<=3) {from[i]+=Math.round((to[i]-from[i])/steps); i++;}
    fade_array.push('#'+from[1].toString(16).padStart(2,'0')+from[2].toString(16).padStart(2,'0')+from[3].toString(16).padStart(2,'0'));
    steps--;
  }
  return fade_array;
}

/* ================================================================= */
/* === SOCKET.ON MESSAGE DEFINITION ================================ */
/* ================================================================= */
LEDbar.prototype.socket_on_message = function(socket,socket_emit) {
  if (socket_emit==undefined) {socket_emit=()=>{}}
  var ledBar=this;
  socket.on('message', function(msg,meta) {
    if (meta&&meta.rooms&&meta.rooms.includes('#led')) {
      let c=(/^#([0-9a-f]{6})$/i.exec(msg)); if (c) {
        ledBar.blinkLED(c[1]);
        socket_emit('message','Ok. Colour is #'+ledBar.current_color+' now.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let d=(/^fade\ #([0-9a-f]{6})$/i.exec(msg)); if (d) {
        ledBar.fadeLED(d[1]);
        socket_emit('message','Ok. Colour fading to #'+ledBar.current_color+'.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let e=(/^fade$/i.exec(msg)); if (e) {
        ledBar.fadeLED();
        socket_emit('message','Ok. Colour fading to #'+ledBar.current_color+'.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let f=(/^rainbow$/i.exec(msg)); if (f) {
        ledBar.rainbowLED();
        socket_emit('message','Ok. Rainbow to #'+ledBar.current_color+'.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let f2=(/^rainbow\ ([0-9]{1,2})\ ([0-9]{1,3})$/i.exec(msg)); if (f2) {
        ledBar.rainbowLED(undefined,f2[1],f2[2]);
        socket_emit('message','Ok. Rainbow to #'+ledBar.current_color+' ('+f2[1]+' steps, '+f2[2]+'ms delay).',{rooms:[(meta?meta.sender:undefined)]});
      }
      let g=(/^sparkle$/i.exec(msg)); if (g) {
        ledBar.sparkle();
        socket_emit('message','Ok. Sparkling.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let g2=(/^sparkle\ ([0-9]{1,3})$/i.exec(msg)); if (g2) {
        ledBar.sparkle(g2[1]);
        socket_emit('message','Ok. Randomly sparkling for '+g2[1]+' seconds.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let g3=(/^sparkle\ ([0-9]{1,3})\ ([0-9]{1,3})$/i.exec(msg)); if (g3) {
        ledBar.sparkle(g3[1],g3[2]);
        socket_emit('message','Ok. Randomly sparkling for '+g3[1]+' seconds at '+g3[2]+' sparcs per second.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let g4=(/^sparkle\ ([0-9]{1,3})\ ([0-9]{1,3})\ ([0-9]{1,3})$/i.exec(msg)); if (g4) {
        ledBar.sparkle(g4[1],g4[2],g4[3]);
        socket_emit('message','Ok. Randomly sparkling for '+g4[1]+' seconds at '+g4[2]+' sparcs per second with average duration of '+g4[3]+'ms.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let i=(/^party$/i.exec(msg)); if (i) {
        ledBar.party(20);
        socket_emit('message','Ok. Party!',{rooms:[(meta?meta.sender:undefined)]});
      }
      let i2=(/^party\ ([0-9]{1,3})$/i.exec(msg)); if (i2) {
        ledBar.party(i2[1]);
        socket_emit('message','Ok. Party for '+i2[1]+' seconds.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let j=(/^defaultaction\ ([a-z]{1,7})$/i.exec(msg)); if (j) {
        let da=ledBar.set_default_action(j[1]);
        if (da) {socket_emit('message','Default action set to: '+da,{rooms:[(meta?meta.sender:undefined)]})}
          else {socket_emit('message','Available default actions: '+ledBar.actions.map((a)=>a[0]).join(', '),{rooms:[(meta?meta.sender:undefined)]})}
      }
      let k=(/^info\ #([0-9a-f]{6})$/i.exec(msg)); if (k) {
        ledBar.show_info(k[1]);
        ledBar.show_info_animation(k[1]);
        socket_emit('message','Ok. Info displays in #'+k[1]+' now.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let k2=(/^info$/i.exec(msg)); if (k2) {
        ledBar.show_info(k2[1]);
        socket_emit('message','Ok. Info display is off.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let m1=(/^zoo$/i.exec(msg)); if (m1) {
        ledBar.zoo();
        socket_emit('message','Ok. Adding pixels to pixelZoo.',{rooms:[(meta?meta.sender:undefined)]});
      }
      let m2=(/^zoo\ ([0-9]{1,3})$/i.exec(msg)); if (m2) {
        ledBar.zoo(m2[1]);
        socket_emit('message','Ok. Adding pixel to pixelZoo for '+m2[1]+' seconds.',{rooms:[(meta?meta.sender:undefined)]});
      }
      if ((!c)&&(!d)&&(!e)&&(!f)&&(!f2)&&(!g)&&(!g2)&&(!g3)&&(!g4)&&(!i)&&(!i2)&&(!j)&&(!k)&&(!k2)&&(!m1)&&(!m2)) {
        ledBar.blinkLED();
        socket_emit('message','Ok. How do you like #'+ledBar.current_color+'?',{rooms:[(meta?meta.sender:undefined)]});
      }
    } else {
      ledBar.default_action();
    }
  });
}
