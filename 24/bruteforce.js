Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};


var BF = {};


/******************
 * Generates a function which:
 * - takes in an array of numbers and two ints
 *   the second int is GUARANTEED to be > the first
 *   (strictly)
 * - returns an array of numbers one shorter
 * - has a property "s" which is its name 
 *   (apparently "name" is reserved)
 ******************/

BF.op = function (fun, s) { 
	var out = function (numbersin, a, b) {
		var i, numbersout = [];
		for (i = 0; i < numbersin.length; i++) {
			switch (i) {
			case a:
				break;
			case b:
				numbersout[numbersout.length] = 
					fun (numbersin[a], numbersin[b]);
				break;
			default: 
				numbersout[numbersout.length] = 
					numbersin[i];
				break;
			}
		}
		return numbersout;
	};
	out.s = s;
	return out;
};


BF.add = function (a, b) { return (a + b); };
BF.sub1 = function (a, b) { return (a - b); };
BF.sub2 = function (a, b) { return (b - a); };
BF.mul = function (a, b) { return (a * b); };
BF.div1 = function (a, b) { return (a / b); };
BF.div2 = function (a, b) { return (b/a); };

BF.ops = [
          BF.op(BF.add, "add"),
          BF.op(BF.sub1, "sub1"),
          BF.op(BF.sub2, "sub2"),
          BF.op(BF.mul, "mul"),
          BF.op(BF.div1, "div1"),
          BF.op(BF.div2, "div2")
];


/****************
 * Given an array of numbers, return either
 * solution of the form
 * \n
 * \n
 * a operation b \n
 * c operation d \n
 * 
 * ... etc.
 * 
 * or undefined, if no solution exists
 */
BF.attempt = function (numbers) {
	var i, j, a, b, result, children = BF.chooseTwo(numbers.length);
	if (numbers.length === 1) {
		if (numbers[0] === 24) {
			return ("\n");
		}
	}
	for (i = 0; i < children.length; i++) {
		for (j = 0; j < BF.ops.length; j++) {
			result = BF.attempt(BF.ops[j](numbers, children[i][0], children[i][1]));
			if (result) {
				return result + "\n" + numbers[children[i][0]] + " " +
				BF.ops[j].s + " " + numbers[children[i][1]];
			}
		}
	}
};

/************
 * Return list of length C(n, 2) of,
 * uh, C(n, 2) possibilities
 */
BF.chooseTwo = function (n) {
	var i, j, output = [];
	for (i = 0; i < n; i++) {
		for (j = i + 1; j < n; j++) {
			output[output.length] = [i, j];
		}
	}
	return output;
};

/***************
 * Yay debugging!
 */
BF.test = function () {
	var nums = [11,7,3,361];
	alert(BF.attempt(nums));
};

