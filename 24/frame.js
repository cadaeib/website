// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function Window() {
	this.HEIGHT = 300;
	this.WIDTH = 300;
	this.RADIUS = 30;
	this.displayTextSize = 60;
	this.can = document.getElementById("game");
	this.ctx = this.can.getContext("2d");
	if (this.can.offsetLeft !== undefined) {
		this.canvasMinX = this.can.offsetLeft; // x-coord of upper left
		this.canvasMinY = this.can.offsetTop; // y-coord of upper left
	}
	else {
		this.canvasMinX = 0;
		this.canvasMinY = 0;
	}
	this.animations = [];
}

Window.prototype.setFill = function (n) {
	if (n === 24) { this.ctx.fillStyle = "#DA2"; }
	else { 
		if ((n < 14) && (n >= 0)) { 
			this.ctx.fillStyle = Window.styles[n]; 
		}
		else { this.ctx.fillStyle = "#DDD"; }
	}
};

Window.prototype.setStroke = function (n) {
	if (n === 24) {this.ctx.strokeStyle = "#DA2"; this.ctx.lineWIDTH = 5;}
	else {
		this.ctx.lineWidth = 3; 
		if ((n < 14) && (n >= 0)) { 
			this.ctx.strokeStyle = Window.styles[n]; 
		}
		else  { this.ctx.strokeStyle = "#DDD"; }
	}
};

/* color-coding the numbers */
Window.styles = [ 
               "#222",
               "#BBB",
               "#AAF",
               "#B11",
               "#5AA",
               "#E99",
               "#7F0",
               "#E47",
               "#FF3",
               "#F21",
               "#1F8",
               "#F93",
               "#ED9",
               "#FAD"
               ];

/*********
 * Take an object, with properties x, y, r,
 * num, and den and draw it as a circle, 
 * with colour depending on the number.
 */
Window.prototype.drawFraction = function (f) {
	var text;
	this.ctx.fillStyle = "#000";
	this.circle(f.x, f.y, f.r);
	this.ctx.fill();
	this.ctx.fillStyle = "#FFF";
	text = f.num.toString();
	if (f.den !== 1) {
		text = text + "/" + f.den.toString();
	}
	this.labelCircle(f.x, f.y, f.r, text);
	this.setStroke(f.num);
	this.circle(f.x, f.y, f.r * 4/5);
	this.ctx.stroke();
};

/**************
 * Draw filled circle centred at x, y w/ radius r
 */

Window.prototype.circle = function (x, y, r) {
	this.ctx.beginPath();
	this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
};

/***********
 * draw appropriately-sized, centered text
 * onto circle 
 */
Window.prototype.labelCircle = function (x, y, r, text) {
	this.ctx.textAlign = "center";
	this.ctx.textBaseline = "middle";
	var prevfont = this.ctx.font; // store prev font
	var size = r * 0.8;
	this.ctx.font = "bold " + (size).toString() + "pt sans-serif";
	this.ctx.fillText(text, x, y);
	this.ctx.font = prevfont; // restore previous font
};

/*************
 * draw the little circle that appears when
 * you drag on a number
 */
Window.prototype.drawOp = function (frac, i, r) {
	var text = Fraction.ops[i];
	var x = (i % 2) ? frac.x - r : frac.x + r;
	var y = (i > 1) ? frac.y - r : frac.y + r;
	this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
	this.circle(x, y, r * 2/3);
	this.ctx.fill();
	this.ctx.fillStyle = "#FFF";
	this.labelCircle(x, y, r * 2/3, Fraction.ops[i]);
};


/*******
 * SHINIES. specifically a single random shiny.
 */

Window.Burst = function (frac) {
	this.parent = frac;
	this.x = this.parent.x + Math.random() * 10 - 5;
	this.y = this.parent.y + Math.random() * 10 - 5;
	this.size = Math.random() * frac.r/2 + frac.r/3;
  this.opacity = 1;
};

/************
 * Draw said shiny as a STAR! or a circle, if that
 * refuses to load. :(
 */

// TODO: look into using globalAlpha
Window.prototype.drawBurst = function (b) {
	if ((b.x < this.WIDTH) && (b.y < this.HEIGHT) && (b.x > 0) && (b.y > 0)) {
		if (b.image) {
			 this.ctx.drawImage(b.image, b.x, b.y, b.size, b.size); 
		} else {
			this.ctx.fillStyle = "#F00";
			//		alert(b.x + " " + b.y + " " + b.size);
			this.circle(b.x, b.y, b.size);
			this.ctx.fill();
		}
	}
};

/*************
 * The shiny moves out and shrinks
 */

Window.prototype.stepBurst = function (b) { // TODO: opacity
	var dx = b.x - b.parent.x, dy = b.y - b.parent.y;
	if (dx > 0) { b.x += b.size * 0.2 * dx / (dy + dx); }
	else		{ b.x -= b.size * 0.2 * dx / (dy + dx); }
	if (dy > 0) { b.y += b.size * 0.2 * dy / (dy + dx); }
	else		{ b.y -= b.size * 0.2 * dy / (dy + dx); }
	b.size *= 0.98;
};


/*****************
 * Make a random-length, random-position drip.
 */

Window.prototype.makeDrip = function (frac) {
	var d = {};
	d.parent = frac;
	d.x = Math.random() * 1.2 - 0.8; // random from -0.8 to 0.4, b/c of offset later
	d.length = Math.random() + 1;
	d.size = Math.random() * 5 + 5;	
	return d;
};

/***************
 * Draw that drip, relative to its parent's
 * x, y, and size
 */

Window.prototype.drawDrip = function (d) {
	this.setStroke(d.parent.num);
	this.setFill(d.parent.num);
	this.ctx.lineWidth = d.size;
	this.ctx.beginPath();
	this.ctx.moveTo(d.parent.x + d.x * d.parent.r, d.parent.y);
	this.ctx.lineTo(d.parent.x + d.x * d.parent.r, d.parent.y + d.length * d.parent.r);
	this.ctx.stroke();
	this.circle(d.parent.x + d.x * d.parent.r, d.parent.y + d.length * d.parent.r, 
			d.size / 2);
	this.ctx.fill();
};

/************
 * Make one of those random circles that makes up
 * the clouds
 */

Window.prototype.makeBubble = function (frac, i) {
	var b = {};
	b.parent = frac;
	b.size = (i+5)/10; // make sure we have good range of sizes
	b.x = Math.random() * (1.5 - i/4);
	b.y = Math.random() * (1.5 - i/4);
	if (Math.random() > 0.5) { b.x *= -1; }
	if (Math.random() > 0.5) { b.y *= -1; }
	return b;
};


/*********************8
 * Draw that circle!
 */
Window.prototype.drawBubble = function (b) {
	this.setFill(b.parent.num);	
	this.circle(b.parent.x + b.x * b.parent.r, b.parent.y + b.y * b.parent.r, b.size * b.parent.r);
	this.ctx.fill();
};

/************
 * Draw a button that has attributes x, y, r, text
 */
Window.prototype.drawButton = function (b) {
	this.ctx.fillStyle = "#000";
	this.circle(b.x, b.y, b.r);
	this.ctx.fill();
	this.ctx.fillStyle = "#FFF";
	this.labelCircle(b.x, b.y, b.r, b.text);
};

/******************
 * same as drawButton, but greyed out (for when inapplicable)
 */

Window.prototype.drawGreyButton = function (b) {
	this.ctx.fillStyle = "#999";
	this.circle(b.x, b.y, b.r);
	this.ctx.fill();
	this.ctx.fillStyle = "#FFF";
	this.labelCircle(b.x, b.y, b.r, b.text);	
};

Window.prototype.clear = function () {
	this.ctx.clearRect(0,0,this.WIDTH,this.HEIGHT);
};

/************
 * return whether any generic circular thing
 * contains the event
 */

Window.prototype.containsMouse = function (o, ev) {
	var dx = ev.pageX - this.canvasMinX - o.x;
	var dy = ev.pageY - this.canvasMinY - o.y;
	return (dx * dx + dy * dy < o.r * o.r);
};


/***********
 * display the text it's given in light grey
 */
Window.prototype.displayText = function (s) {
	this.ctx.fillStyle = "rgba(0,0,0,0.5)";	
	this.ctx.font = "bold " + this.displayTextSize + "pt sans-serif";
	this.ctx.fillText(s, this.WIDTH/2, this.HEIGHT/3);	
};

/**********
 * dwindle a fraction away to nothing
 */
Window.prototype.shrinkFraction = function (f, after) {
	var a = {};
	a.t = 50;
	a.fun = function () { 
		f.r = f.r - (50 - a.t)/50;
	};
	if (after) {
		a.cleanup = after; // wtf, not happening?
	}
	this.animations[this.animations.length] = a;
	return a;
};


/*********
 * add 10 bursts to a fraction, and step them
 * each time animations step
 */
Window.prototype.burstFraction = function (f, after) {
	var a = {}, i, that = this;
	a.t = 50;

	for (i = 0; i < 10; i++) {
		f.bg.bursts[f.bg.bursts.length] = new Window.Burst(f);
	}
	
	a.fun = function () { // hardcoding initial radius
		for (i = 0; i < f.bg.bursts.length; i++) {
			that.stepBurst(f.bg.bursts[i]);
			that.drawBurst(f.bg.bursts[i]);
		}
	};
	a.cleanup = after;
	this.animations[this.animations.length] = a;
};

/************
 * make the fraction do that wibbly-wobbly thing
 * (acts like a damped spring)
 */
Window.prototype.boingFraction = function (f, speed) {
	if (f === null) { return; }
	var a = {}, that = this;
	a.t = 80;
	a.speed = speed;
	
	a.fun = function () {
		this.acc = (f.originalr - f.r)/15;
		this.speed = (this.speed + this.acc) * 0.85 ;
		f.r += this.speed;
	};
	this.animations[this.animations.length] = a;
};


/*************
 * Step all the animations
 */
Window.prototype.step = function () {
	var i, cleanup;
	for (i = this.animations.length - 1; i >= 0; i--) // backwards, so we can delete as we go
		{
			if (this.animations[i].t > 0) { // if animation isn't done
				this.animations[i].fun(); // make it do whatever it should
				this.animations[i].t -= 1; 
			}
			else {
				cleanup = this.animations[i].cleanup; // remember its cleanup
				this.animations.remove(i); 	// and then kill it!
				if (cleanup) { cleanup(); } // and then call the cleanup
//				alert("removing animation " + i);
			}
		}
};


Window.prototype.animating = function () { // return # of things being animated
	return (this.animations.length);
};
