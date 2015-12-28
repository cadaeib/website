function Fraction (i, TF) {
	var j, that = this, w = TF.window;
	this.pos = i; // position. actual index in array may be different!
	this.visible = true;
	this.TF = TF;
	this.parent = null;
	this.num = Math.floor(Math.random() * 13) + 1;
	this.den = 1;
	this.index = i; // [ 0 1 ] [ 2 3 ]
	this.x = (i % 2) ? w.WIDTH * 4 / 5 : w.WIDTH / 5;
	this.y = (i > 1) ? w.HEIGHT * 4 / 5 : w.HEIGHT / 5;
	this.r = 30;
	this.originalr = 30;
	this.bg = {
			bursts: [], // array of things that come out on victory
			drips: [], // array of drippy paint things
			bubbles: [], // array of circles making up cloud
			refresh: function () {
				for (j = 0; j < 2; j++)
				{ this.drips[j] = w.makeDrip(that); }
				for (j = 0; j < 10; j++)
				{ this.bubbles[j] = w.makeBubble(that, j); }  
				
			},
			draw: function () {
				for (j = 0; j < 2; j++) { TF.window.drawDrip(this.drips[j]); }
				
				for (j = 0; j < 5; j++) { TF.window.drawBubble(this.bubbles[j]); }

			}
		};
		
}


Fraction.prototype.draw = function () {
	var i, j; 
	if (this.visible) {
		this.bg.draw();
		if (((this.TF.dfa.currState === this.TF.dfa.STATE.FRACSELECTED) || 
				(this.TF.dfa.currState === this.TF.dfa.STATE.FRACCLICKED)) 
				&& (this.TF.currFrac === this)) { // draw operations
			for (i = 0; i < 4; i++) { 
				this.TF.window.drawOp(this, i, this.TF.window.RADIUS); 
				}
		}

	if (this.TF.currOp !== null) { // darken/draw selected operation
		if (this.TF.currOp.parent === this) {
			this.TF.window.drawOp(this, this.TF.currOp.i, this.TF.window.RADIUS);
		}
	}
	
	this.TF.window.drawFraction(this);
	}
};

Fraction.prototype.containsMouse = function (ev) {
	return this.TF.window.containsMouse(this, ev);
};

Fraction.prototype.simplify = function () {
	// this scales with the denominator, but we
	// can safely assume the denominator is reasonably small.
	var i;
	for (i = this.den; i > 1; i--) {
		if (!(this.num % i) && !(this.den % i)) {
			this.den = this.den / i;
			this.num = this.num / i;
		}
	}
};

Fraction.prototype.createMultiply = function () {
	var frac = this, mulFun = function (that) {
		frac.num *= that.num;
		frac.den *= that.den;
		frac.simplify();
	};
	mulFun.i = 0;
	mulFun.parent = this;
	return mulFun;
};

Fraction.prototype.createAdd = function () {
	var frac = this, addFun = function (that) {
		frac.den *= that.den;
		frac.num *= that.den;
		frac.num += that.num * frac.den / that.den;
		frac.simplify();
	};
	addFun.i = 2;
	addFun.parent = this;
	return addFun;
};

Fraction.prototype.createSubtract = function () {
	var frac = this, subFun = function (that) {
		frac.den *= that.den;
		frac.num *= that.den;
		frac.num -= that.num * frac.den / that.den;
		frac.simplify();
	};
	subFun.parent = this;
	subFun.i = 3;
	return subFun;
};

Fraction.prototype.createDivide = function () {
	var frac = this, divFun = function (that) {
		frac.num *= that.den;
		frac.den *= that.num;
		frac.simplify();
	};
	divFun.i = 1;
	divFun.parent = this;
	return divFun;
};

Fraction.prototype.toNum = function () {
	return ((this.num) / (this.den));
};

Fraction.prototype.moveTowards = function (that) {
	this.x = that.x - ((that.x - this.x) * (9/10));
	this.y = that.y - ((that.y - this.y) * (9/10));
};

Fraction.ops = ["x", "\u00F7", "+", "-"];

Fraction.prototype.copyTo = function (dest) {
	var a;
	for (a in this) { 
		dest[a] = this[a];
	}
};
