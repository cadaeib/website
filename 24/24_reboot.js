
//TODO: bonus points for getting a puzzle quickly!
//TODO: handle those unnecessary "press" functions in buttons

$(document).ready(function() {

	/***********************************
	 * Adding some functions to built-in things, namely arrays.
	 */

	Array.prototype.remove = function (from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	}; // gah, never thought I'd miss ifndefs.



	/*****************************
	 * One HUUUUGE global variable that stores
	 * the entire state of the game.
	 */

	var TF = {
			NUMFRACS: 4,
			currFrac: null,
			currOp: null,
			displayText:"",
			score: 0,
			hiScore: 0,
			hiGlobal: 0,
			fracs: [], // unordered.
			originalfracs: [],
			undoable: false,
			prevmove: {},
			steps: null,
			unscored: false, // does the current solution not count for score?
			solvableOnly: true, // are we only showing solvable puzzles?
			mouseMoved: false,
			undo: {
				x: 150,
				y: 250,
				r: 20,
				originalr:20,
				text: '\u219c', // squiggly left arrow
				press: function () {
					TF.undoable = false;

					TF.prevmove.a.copyTo(TF.prevmove.a.parent);
					TF.prevmove.b.copyTo(TF.prevmove.b.parent);
					if (TF.fracs.indexOf(TF.prevmove.a.parent) === -1) { 
						TF.fracs[TF.fracs.length] = TF.prevmove.a.parent;
					}
					if (TF.fracs.indexOf(TF.prevmove.b.parent) === -1) { 
						TF.fracs[TF.fracs.length] = TF.prevmove.b.parent;
					}
				}
			},
			skip: {
				x: 150,
				y: 150,
				r: 20,
				originalr:20,
				text: '\u2192',
				press: function () {
					TF.bruteForce();
					TF.reset();
				}
			}				
	};


	TF.showOnlySolvable = function () {
		TF.solvableOnly = true;
		$('#giveup').text("Show solution?");
		$('#togglesolvableonly').text("Filtering out unsolvable puzzles");
	};

	TF.fuckIt = function () {
		TF.solvableOnly = false;
		$('#giveup').text("Think this one's impossible?");
		$('#togglesolvableonly').text("Not filtering out unsolvable puzzles");
	};


	TF.toggleSolvableOnly = function () {
		if (TF.solvableOnly) { TF.fuckIt(); }
		else { TF.showOnlySolvable(); }
	};

	TF.makePause = function (n, after) {
		var a = {};
		a.t = n;
		a.fun = void(0);
		a.cleanup = after;
	};

	TF.copyObject = function (from, to) {
		var prop;
		for (prop in from) {
			if (from.hasOwnProperty(prop)) {
				to[prop] = from[prop];
			}
		}
	}

	TF.debug = {
			/*******************
			 * change the title of the page.
			 */
			changeTitle: function (s) {
				document.getElementById("title").innerHTML = s;
			}
	};

	TF.unsolvable = function () {
		return (!TF.bruteForce());
	};

	TF.restoreOriginal = function () {
		var i;
		for (i = 0; i < TF.NUMFRACS; i++) {
			TF.fracs[i] = TF.originalfracs[i].parent;
			TF.originalfracs[i].copyTo(TF.fracs[i]);
//			TF.copyObject(TF.originalfracs[i], TF.fracs[i]);
		}
	}

	TF.reset = function () {
		var i;

		TF.timer.t = 60;

		if (TF.window.animations.length === 0) {

			TF.unscored = false;

			do {
				for (i = 0; i < TF.NUMFRACS; i++) {
					TF.fracs[i] = new Fraction(i, TF);
					TF.fracs[i].bg.refresh();
					TF.originalfracs[i] = new Fraction(i, TF);
//					TF.copyObject(TF.fracs[i], TF.originalfracs[i]);
					TF.fracs[i].copyTo(TF.originalfracs[i]);
					TF.originalfracs[i].parent = TF.fracs[i];
				}
			} while (TF.unsolvable());
			TF.dfa.currState = TF.dfa.STATE.START;

			TF.undoable = false;
		} else {
      // if there's an animation going on, call ourselves again
      // once that's over.
      var lastAnimation = TF.window.animations[TF.window.animations.length-1];
      // this is not necessarily the last to end -- that's okay.
      // the important bit is that if there are any others ending at 
      // the same timestep, we append this to the last cleanup to get called.
      // Otherwise we'd have reset() getting appended to a callback that
      // already got called, and the game wouldn't reset at all.
      // if we it already has a cleanup, append reset to that
      if (oldCleanup = lastAnimation.cleanup) {
        lastAnimation.cleanup = function() {
          oldCleanup();
          TF.reset();
        }
      } else {
        // otherwise just set TF.reset as its cleanup
        lastAnimation.cleanup = TF.reset;
      }
    }
	};


	/**************************
	 * Set up everything that can't be set up in
	 * the constructor and reset the game.
	 **************************/
	TF.init = function () {
		this.window = new Window();
		this.can = document.getElementById("game");	
		this.ctx = this.can.getContext("2d");

		this.star = new Image();
		this.star.src = "star.png";
		Window.Burst.prototype.image = this.star;

		this.timer.t = 60;

		this.prevmove.a = new Fraction(0, this);
		this.prevmove.b = new Fraction(0, this);

		this.reset();
		this.timer.tick(); // start the timer
		TF.updateHiGlobal();
		return setInterval(TF.update, 10);

	};

	TF.updateHiGlobal = function () {
		$.get("hiscoremysql.php", function (data) {
			TF.hiGlobal = data;
		});
		setTimeout(TF.updateHiGlobal, 600000); // update every 10 mins
	};

	TF.setHiGlobal = function () {
		TF.hiGlobal = TF.score;
		$.post("hiscoremysql.php", {newscore: TF.score});
	};

	TF.displayScore = function () {
		if (TF.score > TF.hiGlobal) {
			TF.setHiGlobal(); // update
		}
		document.getElementById("score").innerHTML = "Score: "
			+ this.score.toString()+"   Best: " + this.hiScore.toString();
		document.getElementById("global").innerHTML = "Global best: " 
			+ this.hiGlobal.toString();
	};


	TF.checkDone = function () {
  console.log(TF.fracs.length);
		if (TF.fracs.length < 2) {
			TF.finishRound(); 
		}
	};

	TF.finishRound = function () {
		var i;

	  if ((TF.fracs[0].num === 24) 
			&& (TF.fracs[0].den === 1)) {
			if (!TF.unscored) {
			  TF.score += 2;
			}
		  TF.window.burstFraction(TF.fracs[0], TF.reset);
		}
		else {
			TF.window.shrinkFraction(TF.fracs[0], TF.reset);
			if (!TF.unscored) {
				TF.score--;
			}
		}
		// update hiscore if necessary
		TF.hiScore = (TF.score > TF.hiScore) ? TF.score : TF.hiScore;
		// reset, after animations finish
	  TF.reset();
	};


	TF.setPrevMove = function (a, b) {
		/******
		 * keeps track of the prev states of fracs
		 * involved in last operation, in case it's undone.
		 */
		a.copyTo(TF.prevmove.a);
		b.copyTo(TF.prevmove.b); 
		TF.prevmove.a.parent = a;
		TF.prevmove.b.parent = b;
		TF.undoable = true;
	};

	TF.update = function () {
		TF.timer.display();
		if (TF.timer.t < 0) { TF.reset(); TF.timer.t = 60; TF.score--; }
		if (TF.timer.t < 10) { 
			$('#timer').addClass("urgenttimer"); 
		} else { $('#timer').removeClass("urgenttimer"); }
		TF.displayScore();
		TF.draw();
	};

	TF.draw = function () {
		var i;
		// clear
		TF.window.clear();
		// draw fractions
		for (i = 0; i < TF.fracs.length; i++) {
			TF.fracs[i].draw();
		}
		TF.window.displayText(TF.displayText);

		TF.window.drawButton(TF.skip);
		if (TF.undoable) { TF.window.drawButton(TF.undo); }
		else { TF.window.drawGreyButton(TF.undo); }
		// animate
		TF.window.step();

	};

	TF.updateCurrFrac = function (ev) {
		var i;
		this.currFrac = null;
		for (i = 0; i < TF.fracs.length; i++) {
			if (this.fracs[i].containsMouse(ev)) 
			{ this.currFrac = this.fracs[i]; }
		}
	};


	TF.handleMouseMove = function (ev) {
		var frac, i;
		if (TF.dfa.currState === TF.dfa.STATE.FRACSELECTED) {
			if (ev.pageX - TF.window.canvasMinX > TF.currFrac.x) {
				if (ev.pageY - TF.window.canvasMinY > TF.currFrac.y) 
				{ TF.currOp = TF.currFrac.createMultiply(); }
				else 
				{ TF.currOp = TF.currFrac.createAdd(); }
			}
			else {
				if (ev.pageY - TF.window.canvasMinY > TF.currFrac.y) 
				{ TF.currOp = TF.currFrac.createDivide(); }
				else 
				{ TF.currOp = TF.currFrac.createSubtract(); }
			}
		}

		TF.dfa.mouseMove(ev);
	};

	TF.handleMouseDown = function (ev) {
		if (TF.dfa.currState === TF.dfa.STATE.START) {
			TF.currOp = null;
			TF.updateCurrFrac(ev);
			if (TF.currFrac !== null) { TF.dfa.currState = TF.dfa.STATE.FRACSELECTED; }
			TF.mouseMoved = false;

		}
		TF.dfa.mouseDown(ev);
	};

	TF.mouseActuallyDidMove = function (ev) {
		TF.mouseMoved = true;
		TF.handleMouseMove(ev);
	}

	TF.handleMouseUp = function (ev) {
		var i;

		// check to see if skip was clicked
		if (TF.window.containsMouse(TF.skip,ev)) { 
			if (TF.window.animations.length === 0) { // NO BUTTON MASHING. >:(
				TF.bruteForce();
				TF.score--; 
				for (i = 0; i < TF.fracs.length; i++) {
					TF.window.shrinkFraction(TF.fracs[i], TF.reset);
				}
				TF.makePause(50, TF.reset);
			}
			return 0;	
		} 
		
		// check if undo was clicked
		if (TF.window.containsMouse(TF.undo,ev) && (TF.undoable)) {
			TF.window.boingFraction(TF.undo, 1);
			TF.undo.press(); 
			TF.dfa.currState = TF.dfa.STATE.START;
			TF.currOp = null;
			return 0;
		}

		
		if (TF.dfa.currState == TF.dfa.STATE.OPSELECTED) {
			TF.updateCurrFrac(ev); 

			if (TF.currFrac !== null) {
				TF.window.boingFraction(TF.currOp.parent,5);
				if (TF.currOp.parent !== TF.currFrac) {
					TF.setPrevMove(
							TF.currOp.parent, 
							TF.currFrac);
					TF.undoable = true;
					TF.currOp(TF.currFrac);
					TF.currOp.parent.simplify();
					TF.fracs.remove(TF.fracs.indexOf(TF.currFrac));
				}
			}
			TF.currOp = null;
			TF.currFrac = null;			
		}
		TF.dfa.mouseUp(ev);
    // check to see if game is over
    TF.checkDone();
	};



	TF.timer = {
			tick: function () {
				TF.timer.t--;
				var timer = setTimeout(TF.timer.tick, 1000);
			}, 

			display: function () {
				document.getElementById("timer").innerHTML = TF.timer.t.toString() + " s";
			}, 

			color: function (isUrgent) {
				// TODO: actually make this work
				if (isUrgent) { document.getElementById("timer").className = 'urgenttimer'; }
				else { document.getElementById("timer").className = 'timer'; }
			}
	};	

	/************
	 * Brute-force find a solution.
	 */
	TF.bruteForce = function () { 
		var i, nums = [];
		for (i = 0; i < TF.fracs.length; i++) {
			nums[nums.length] = TF.fracs[i].toNum();
		}
		return BF.attempt(nums);
	};

	/**********
	 * Given a number, find a fraction that simplifies to it.
	 */
	TF.findFrac = function (n, goBackwards) {
		var i;
		if (!goBackwards) {
			for (i = 0; i < TF.fracs.length; i++) {
				if (TF.fracs[i].toNum() == n) {
					return TF.fracs[i];
				}
			}
		}
		else {
			for (i = TF.fracs.length - 1; i >= 0; i--) {
//				alert(TF.fracs[i].toNum());
				if (TF.fracs[i].toNum() == n) {
					return TF.fracs[i];
				}
			}
		}
	};

	/*******
	 * Animate a single operation, and call animateStep() 
	 * to animate the next step if appropriate (which in turn
	 * calls TF.animateOp again, etc.)
	 */

	TF.animateOp = function (op, frac, next) {
		var shrinkAndCallNext = {
				t: 80,
				fun: function () { 
					frac.visible = false;
				},
				cleanup: function () {
					TF.displayText = "";
					TF.fracs.remove(TF.fracs.indexOf(frac));
					if (TF.steps[next].length > 1) {
						TF.animateStep(next);
					}
				}
		};

		TF.window.animations[TF.window.animations.length] = {
				t:50,
				fun: function () {
					frac.moveTowards(op.parent);
				},
				cleanup: function () { // add the animation to shrink the used thing,
					// which in turn will animate the next step
					// if appropriate
					op(frac);
					op.parent.simplify();

					TF.window.animations[TF.window.animations.length] = 
						shrinkAndCallNext;
				}

		};
	};

	/********
	 * Set the grey text to s, animate it,
	 * and call after when animation is done.
	 */

	TF.setDisplayText = function (s, after) {
		TF.displayText = s;
		TF.window.displayTextSize = 50;
		TF.window.animations[TF.window.animations.length] = 
		{
				t: 50,
				fun: function () { TF.window.displayTextSize -= 0.4; },
				cleanup: function () {
					TF.displayText = "";
					if (after) { after(); }
				}
		};
	};

	/*****************
	 * Take the ith line of the solution,
	 * interpret it and animate it.
	 */
	TF.animateStep = function (i) {
		var a, b, anum, bnum, components, op, other;
		TF.displayText = "";
		components = TF.steps[i].split(" ");
		anum = parseInt(components[0]);
		bnum = parseInt(components[2]);
		a = TF.findFrac(components[0], false);
		b = TF.findFrac(components[2], true);
		switch (components[1]) {
		// cases for all the different operations we have
		case "add":
			op = a.createAdd();
			other = b;
			TF.setDisplayText(anum + " + " + bnum + " = " + (anum + bnum));
			break;
		case "sub1":
			op = a.createSubtract();
			other = b;
			TF.setDisplayText(anum + " - " + bnum + " = " + (anum - bnum));
			break;
		case "sub2":
			op = b.createSubtract();
			other = a;
			TF.setDisplayText(bnum + " - " + anum + " = " + (bnum - anum));
			break;
		case "mul":
			op = a.createMultiply();
			other = b;
			TF.setDisplayText(anum + " * " + bnum + " = " + (anum * bnum));
			break;
		case "div1":
			op = a.createDivide();
			other = b;
			TF.setDisplayText(anum + " / " + bnum + " = " + (anum / bnum));
			break;
		case "div2":
			op = b.createDivide();
			other = a;
			TF.setDisplayText(bnum + " / " + anum + " = " + (bnum / anum));
			break;
		default:
			alert ("WTF?!");
		break;
		}
		TF.animateOp(op, other, i-1);
	};

	/************
	 * when "giveup" is clicked, brute-force 
	 * a solution, change score appropriately,
	 * animate. Calls TF.animateStep for each step.
	 */
	TF.animateSolution = function () {
		var string;
		if (TF.window.animations.length === 0) { // don't interrupt animation
			TF.restoreOriginal(); // restore original fracs
			TF.unscored = true; // score for this doesn't count
			string = TF.bruteForce();
			if (string) { TF.steps = string.split("\n"); }
			else { 
				TF.setDisplayText("Good call!", TF.reset);
				TF.score += 2;
				return;
			}
			if (TF.steps.length < 3) { // I THINK this shouldn't happen. 
				return;
			}	
			TF.score -= (TF.solvableOnly) ? 1 : 3;
			TF.animateStep(TF.steps.length - 1);
		}
	};


	/*************
	 * Object to handle states.
	 */
	TF.dfa = {
			currState: 0,
			STATE: { // DFA to handle clicks
				START : 0,
				FRACSELECTED : 1,
				OPSELECTED : 2,
			},

			mouseDown: function (ev) {
				if ((TF.dfa.currState === TF.dfa.STATE.START) && (TF.currFrac !== null)) { 
					TF.dfa.currState = TF.dfa.STATE.FRACSELECTED; 
				}			
			},

			mouseUp: function (ev) {
				switch (TF.dfa.currState) {
				case (TF.dfa.STATE.FRACSELECTED):
					if (TF.mouseMoved) {
						TF.dfa.currState = TF.dfa.STATE.OPSELECTED; 
					}
				break;
				
				case (TF.dfa.STATE.OPSELECTED):
					this.currState = TF.dfa.STATE.START;
				break;
				}
			},

			mouseMove: function (ev) {
			}

	};



	TF.init();	

	$("#giveup").click(TF.animateSolution);
	$("#togglesolvableonly").click(TF.toggleSolvableOnly);
	$(document).mousemove(TF.mouseActuallyDidMove);
	$(document).mouseup(TF.handleMouseUp);
	$(document).mousedown(TF.handleMouseDown);
});

