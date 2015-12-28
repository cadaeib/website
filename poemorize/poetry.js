$(document).ready(function() {
  poemhtml = $('#poemtext').html();
  //var textindex = 0; // pointer to the index of poem we're at
  
  function restart() {
    htmlindex = 0;
    stripNonLetter();
    nextcheckpoint = 0;
    lastcheckpoint = 0;
    hitCheckpoint();
    updateDisplay();
    $('#again').hide();
  }

  function findNextCheckpoint() {
    for (var i = htmlindex+1; 
        (i < poemhtml.length) && 
        (poemhtml.charAt(i).match(/[a-zA-Z0-9 '-]/)); i++) {
    }
    return i; 
  }

  function hitCheckpoint() {
    nextcheckpoint = findNextCheckpoint();
    // change the "updateDisplay" function 
    switch (mode) {
      case "normal": 
        updateDisplay = function () {
          $('#poemvisible').html(poemhtml.substring(0,htmlindex));
          $('#poemrest').html(poemhtml.substring(htmlindex));
        }
        break;
      case "noHints":
        updateDisplay = function () {
          $('#poemvisible').html(poemhtml.substring(0, htmlindex));
          $('#poemhidden').html('');
          $('#poemrest').html('');
        };
        break;
      case "hideOnSecondPass":
        updateDisplay = function () {
          if (secondpass) { // hide next pass
            $('#poemvisible').html(poemhtml.substring(0,htmlindex));
            $('#poemhidden').html(poemhtml.substring(htmlindex, nextcheckpoint));
            $('#poemrest').html(poemhtml.substring(nextcheckpoint));
          } else { // make all visible
            $('#poemvisible').html(poemhtml.substring(0,htmlindex));
            $('#poemhidden').html("");
            $('#poemrest').html(poemhtml.substring(htmlindex));
          }
        };
        if (secondpass) {
          lastcheckpoint = htmlindex;
        } else {
          htmlindex = lastcheckpoint; // global
          stripNonLetter();
          // when backtracking, need to backtrack next checkpoint too
          nextcheckpoint  = findNextCheckpoint();
        }
        secondpass = !secondpass; // global
        break;
      case "hideNextLine":
        updateDisplay = function () {
          $('#poemvisible').html(poemhtml.substring(0,htmlindex));
          $('#poemhidden').html(poemhtml.substring(htmlindex, nextcheckpoint));
          $('#poemrest').html(poemhtml.substring(nextcheckpoint));
        }
        break;
    } 
  }

  function stripNonLetter() {
    // skip past anything blank/punctuation
    while (poemhtml.charAt(htmlindex).match(/[^0-9a-zA-Z]/)) {
      // also rewind to punctuation like ,
      if (poemhtml.substring(htmlindex,htmlindex+4) === "<br>") {
        htmlindex += 4;
      }
      else { 
        htmlindex++;
      }
    } 
    // since we'll call stripNonLetter every time htmlindex changes,
    // check to see whether we've hit a checkpoint here
    if (htmlindex >= nextcheckpoint) { hitCheckpoint(); }
  }

  function updateDisplay() {
      $('#poemvisible').html(poemhtml.substring(0,htmlindex));
      $('#poemrest').html(poemhtml.substring(htmlindex));
  }

  $(document).keypress(function(e) {
    c = String.fromCharCode(e.which);
    if (c.toLowerCase() === poemhtml.charAt(htmlindex).toLowerCase()) {
      htmlindex++; 
      stripNonLetter();
      updateDisplay();
    }
    // user finished poem
    if (htmlindex >= poemhtml.length-1) {
      $('#again').show();
      $('#hintplz').hide();
    }
  });
  
  function addPresets() {
    var presets = [
     { title:"Invictus",
       text:"Out of the night that covers me,\n"+
"Black as the pit from pole to pole,\n"+
"I thank whatever gods may be\n"+
"For my unconquerable soul.\n\n"+

"In the fell clutch of circumstance\n"+
"I have not winced nor cried aloud.\n"+
"Under the bludgeonings of chance\n"+
"My head is bloody, but unbowed.\n\n"+

"Beyond this place of wrath and tears\n"+
"Looms but the Horror of the shade,\n"+
"And yet the menace of the years\n"+
"Finds and shall find me unafraid.\n\n"+

"It matters not how strait the gate,\n"+
"How charged with punishments the scroll.\n"+
"I am the master of my fate:\n"+
"I am the captain of my soul.\n",
       },
     {title:"Corinthians 13",
      text:" If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong or a clanging cymbal.  If I have the gift of prophecy and can fathom all mysteries and all knowledge, and if I have a faith that can move mountains, but do not have love, I am nothing.  If I give all I possess to the poor and give over my body to hardship that I may boast, but do not have love, I gain nothing.\n"+
" Love is patient, love is kind. It does not envy, it does not boast, it is not proud.  It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.  Love does not delight in evil but rejoices with the truth.  It always protects, always trusts, always hopes, always perseveres.\n"+
" Love never fails. But where there are prophecies, they will cease; where there are tongues, they will be stilled; where there is knowledge, it will pass away.  For we know in part and we prophesy in part,  but when completeness comes, what is in part disappears.  When I was a child, I talked like a child, I thought like a child, I reasoned like a child. When I became a man, I put the ways of childhood behind me.  For now we see only a reflection as in a mirror; then we shall see face to face. Now I know in part; then I shall know fully, even as I am fully known.\n"+
" And now these three remain: faith, hope and love. But the greatest of these is love."}
    ]; 

    for (var i = 0; i < presets.length; i++) {
      $('#ideas').append(
        " <a id='preset"+i+"' class='btn'>"+presets[i].title+"</a>");
      // this works because when we call a function, we implicitly 
      // pass arguments by value, so now we have a new copy of i.
      // possibly not the most elegant way to do it though!
      var callback = (function(i) {
        return function () {
          $('#poeminput').val(presets[i].text);
        };
      })(i);
      $('#preset'+i).click(callback);
    }
    $('#ideasbtn').hide();
  }

  /*** global(ish) variables ***/
  var htmlindex = 0;
  var nextcheckpoint = 0; // replace checking every keypress with check once here
  var mode = "normal";
  var secondpass = false; // for hideOnSecondPass mode
  var lastcheckpoint = 0;

  restart();

  /*** BIND LISTENERS TO BUTTONS ***/

  $('#submitpoem').on('click', function() {
    poemhtml = $('#poeminput').val().replace(/\n/g, '<br>');
    restart();
    $('#again').hide();
    $('#poeminputwithbutton').collapse('hide');
  });
  $('#poeminput').focus(function () {
    // "$('#poeminput').select()" returns $('#poeminput')
    $('#poeminput').select().mouseup(function (e) {
      e.preventDefault();
      $(this).unbind("mouseup");
    });
  });
  $('#hintplz').hide(); // put these in css
  $('#again').hide();
  $('#again').on('click', restart);

  function bindModeButton(button, modename, alsoDoThis) {
    button.on('click', function () {
      mode = modename;
      alsoDoThis();
      restart();
      updateDisplay(); // this necessary?
    });
  }
  /* mode buttons! */
  bindModeButton($('#normal'), 'normal', function () { $('#hintplz').hide(); });
  bindModeButton($('#nohints'),'noHints', function () { $('#hintplz').show(); });
  bindModeButton($('#hideNextLine'), 'hideNextLine', function () { $('#hintplz').show(); });
  bindModeButton($('#hideOnSecondPass'), 'hideOnSecondPass', function () { $('#hintplz').show(); secondpass = false; });

  $('#hintplz').on('click', function () {
    while (poemhtml.charAt(htmlindex).match(/[0-9a-zA-Z]/)) {
      htmlindex++;
    }
    stripNonLetter();
    updateDisplay();
  });
  // start load poem hidden
  $('#poeminputwithbutton').collapse('hide');
  $('#ideasbtn').click(addPresets);
});
