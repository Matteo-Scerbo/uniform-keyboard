// VARIABLE DECLARATIONS

// These are for keeping track of what's going on.
var currentModeIndex = -1;
var currentSequenceIndex = 0;
var modeMechanic = 'None';
var playChordSelected = false;
var currentScaleIndex = 0;
var scale = [];
var selectedSequence = [];

// These are for suggesting the harmonic sequence.
var playedSequence = [];
var previousTension = 0;
var consonancePrediction = [];
var expectationPrediction = [];
var firstChord;
var secondChord;
var thirdChord;
var fourthChord;
var fifthChord;
var sixthChord;
var seventhChord;
var eighthChord;
var ninthChord;
var tenthChord;

// These are for playing sounds.
var audioContext = new( window.AudioContext || window.webkitAudioContext );
var compressor = audioContext.createDynamicsCompressor();
var oscList = [];
var lpfList = [];
var gainList = [];

// These are constants for reference.
var freqList = [];
var scaleList = [];
var sequenceList = [];
var numerals = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII' ];
var maxSequenceMemory = 8; // 9 means using tenthChord prediction... which almost crashed the browser
var consonanceThreshold = 100 / 14;
var expectationThreshold = 100 / 14;

// These are for networking.
var userID = null;
var roomName = null;
var myNickname = null;
var iAmAdmin = false;
var previousLocalTimestamp = 0;
var remoteEvents = [];
var scheduledEvent = null;
var justEnteredRoom = false;

// These are for tutorials.
var inTutorial = false;
var tutorialKeypressSequences = [];
var tutorialMessages = [];
var tutorialStep = 0;
var tutorialStepsCount = 0;

// These are for handling the page visualization.
var chatOverlayIsVisible = false;
var tensionBoxIsVisible = false;
var onlineBoxIsVisible = true;
var settingBoxIsVisible = false;

// These are for hiding some debugging or incomplete features
var showConsonance = false;
var showExpectation = true;
var remoteEventDelay = 500;


// CALLING SETUP FUNCTIONS

for ( let i = 0; i < 25; i++ ) {
  oscList[ i ] = null;
}
createFreqList();

createScaleList();
scale = scaleList[ 0 ];

createSequenceList();
changeModeMechanic( 'None' );

renderScale();

compressorSetUp();

updateRoomBox();

updateChatListener();

logIn();

loadJSON( function ( response ) {
  firstChord = JSON.parse( response );
}, './JSON/strict_no_layers_percentage.json' );
loadJSON( function ( response ) {
  secondChord = JSON.parse( response );
}, './JSON/strict_one_layer_percentage.json' );
loadJSON( function ( response ) {
  thirdChord = JSON.parse( response );
}, './JSON/strict_two_layers_percentage.json' );
loadJSON( function ( response ) {
  fourthChord = JSON.parse( response );
}, './JSON/strict_three_layers_percentage.json' );
loadJSON( function ( response ) {
  fifthChord = JSON.parse( response );
}, './JSON/strict_four_layers_percentage.json' );
loadJSON( function ( response ) {
  sixthChord = JSON.parse( response );
}, './JSON/strict_five_layers_percentage.json' );
loadJSON( function ( response ) {
  seventhChord = JSON.parse( response );
}, './JSON/strict_six_layers_percentage.json' );
loadJSON( function ( response ) {
  eighthChord = JSON.parse( response );
}, './JSON/strict_seven_layers_percentage.json' );
loadJSON( function ( response ) {
  ninthChord = JSON.parse( response );
}, './JSON/strict_eight_layers_percentage.json' );
loadJSON( function ( response ) {
  tenthChord = JSON.parse( response );
}, './JSON/strict_nine_layers_percentage.json' );


// LOCAL EVENT LISTENERS

document.getElementById( 'keyboardBox' )
  .addEventListener( 'touchstart', touchToMouse );
document.getElementById( 'keyboardBox' )
  .addEventListener( 'touchmove', touchToMouse );
document.getElementById( 'keyboardBox' )
  .addEventListener( 'touchend', touchToMouse );
document.getElementById( 'keyboardBox' )
  .addEventListener( 'selectstart', function ( e ) {
    e.preventDefault();
  } );

document.getElementById( 'chatBox' )
  .addEventListener( 'mousedown', toggleChatOverlay );

document.getElementById( 'writeMessage' )
  .addEventListener( 'keyup',
    function ( event ) {
      event.preventDefault();
      if ( event.code == 'Enter' ) {
        sendMessage();
      }
    } );

window.addEventListener( 'keydown', ( event ) => {
  if ( chatOverlayIsVisible || event.repeat ) {
    return;
  };
  if ( !event.code.startsWith( 'F' ) && !event.code == 'Escape' ) {
    event.preventDefault();
  }
  handleLocalEvent( event.type, event.code, event.timeStamp );
} );

window.addEventListener( 'keyup', ( event ) => {
  if ( chatOverlayIsVisible ) {
    return;
  };
  if ( !event.code.startsWith( 'F' ) ) {
    event.preventDefault();
  }
  handleLocalEvent( event.type, event.code, event.timeStamp );
} );

document.querySelectorAll( '.key' )
  .forEach( function ( key ) {
    key.addEventListener( 'mousedown', ( event ) => {
      if ( chatOverlayIsVisible ) {
        return;
      }; // This might be overkill: the overlay would be over the keys
      handleLocalEvent( 'keydown', key.dataset[ 'code' ], event.timeStamp );
    } );
    key.addEventListener( 'mouseup', ( event ) => {
      if ( chatOverlayIsVisible ) {
        return;
      }; // This might be overkill: the overlay would be over the keys
      handleLocalEvent( 'keyup', key.dataset[ 'code' ], event.timeStamp );
    } );
    key.addEventListener( 'mouseleave', ( event ) => {
      if ( chatOverlayIsVisible ) {
        return;
      }; // This might be overkill: the overlay would be over the keys
      handleLocalEvent( 'keyup', key.dataset[ 'code' ], event.timeStamp );
    } );
  } );

function touchToMouse( event ) {
  let touch = event.changedTouches[ 0 ];
  let mouseEventType;

  switch ( event.type ) {
    case 'touchstart':
      mouseEventType = 'mousedown';
      break;
    case 'touchend':
      mouseEventType = 'mouseup';
      break;
    case 'touchmove':
      mouseEventType = 'mousemove';
      break;
    default:
      return;
  }

  let mouseEvent = document.createEvent( 'MouseEvent' );
  mouseEvent.initMouseEvent( mouseEventType, true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null );

  touch.target.dispatchEvent( mouseEvent );
  event.preventDefault();
}

// This is called on every keydown or keyup event.
function handleLocalEvent( type, code, timestamp ) {
  if ( type == 'keydown' ) {
    switch ( true ) {
      case code == 'Space':
      case code.startsWith( 'Numpad' ):
        changeMode( code );
        break;
      case code == 'Enter':
        nextTutorialStep();
        break;
      case code == 'Backspace':
        previousTutorialStep();
        break;
      default:
        handleNoteStart( code );
    }
  }
  if ( type == 'keyup' ) {
    switch ( true ) {
      case code == 'Space':
      case code.startsWith( 'Numpad' ):
      case code == 'Enter':
        break;
      default:
        handleNoteStop( code );
    }
  }

  if ( roomName && iAmAdmin ) {
    let computedTimestamp = timestamp - previousLocalTimestamp;
    if ( !previousLocalTimestamp ) {
      computedTimestamp = 0
    };
    previousLocalTimestamp = timestamp;

    firebase.database()
      .ref( 'keypresses/' + roomName )
      .push( {
        code: code,
        type: type,
        timestamp: computedTimestamp
      } )
      .catch( function ( error ) {
        console.error( 'Error updating keypress on Realtime Database:', error );
      } );
  }
}


// REMOTE EVENT LISTENERS

function listenForRemoteEvents( snap, delay ) {
  let remoteEvent = snap.val();
  remoteEvents.push( {
    type: remoteEvent.type,
    code: remoteEvent.code,
    timestamp: remoteEvent.timestamp
  } )
  if ( !scheduledEvent ) {
    scheduledEvent = setTimeout( handleNextRemoteEvent, delay );
  }
}

function handleNextRemoteEvent() {
  if ( remoteEvents[ 0 ].type == 'keydown' ) {
    if ( remoteEvents[ 0 ].code == 'Space' || remoteEvents[ 0 ].code.startsWith( 'Numpad' ) ) {
      changeMode( remoteEvents[ 0 ].code );
    } else {
      handleNoteStart( remoteEvents[ 0 ].code );
    };
  } else {
    handleNoteStop( remoteEvents[ 0 ].code );
  }

  remoteEvents.shift();

  if ( remoteEvents[ 0 ] ) {
    scheduledEvent = setTimeout( handleNextRemoteEvent, remoteEvents[ 0 ].timestamp );
  } else {
    scheduledEvent = null;
  }
}

// Prevent all settings from being focused on:
// this is to avoid unintentionally undoing the last setting change with each
// spacebar press.
document.querySelectorAll( 'input' )
  .forEach( function ( item ) {
    if ( item.id == 'writeMessage' ) {
      return;
    };
    item.addEventListener( 'focus', function () {
      this.blur();
    } )
  } );

firebase.database()
  .ref( '.info/connected' )
  .on( 'value', function ( snap ) {
    if ( !snap.val() ) {
      document.getElementById( 'offlineOverlay' )
        .style.display = 'block';
      document.getElementById( 'authOverlay' )
        .style.display = 'none';
      document.getElementById( 'chatOverlay' )
        .style.display = 'none';
      chatOverlayIsVisible = false;
    } else {
      document.getElementById( 'offlineOverlay' )
        .style.display = 'none';
      if ( !userID ) {
        document.getElementById( 'authOverlay' )
          .style.display = 'block';
      }
    }
  }, function ( error ) {
    console.error( "Error: couldn't determine connection.", error );
    document.getElementById( 'offlineOverlay' )
      .style.display = 'block';
    document.getElementById( 'authOverlay' )
      .style.display = 'none';
    document.getElementById( 'chatOverlay' )
      .style.display = 'none';
    chatOverlayIsVisible = false;
  } );

function logIn() {
  firebase.auth()
    .signInAnonymously()
    .catch( function ( error ) {
      console.error( "Error: couldn't sign in.", error );
    } );
  if ( !userID ) {
    document.getElementById( 'authOverlay' )
      .style.display = 'block';
  } else {
    document.getElementById( 'authOverlay' )
      .style.display = 'none';
  }
}

firebase.auth()
  .onAuthStateChanged( function ( user ) {
    if ( user ) {
      userID = user.uid;

      firebase.database()
        .ref( 'users/' + userID + '/nickname' )
        .once( 'value' )
        .then( function ( snap ) {
          myNickname = snap.val();

          if ( myNickname ) {
            document.getElementById( 'nicknameText' )
              .innerText = 'You are ' + myNickname + '. Click here to change nickname.';
          } else {
            document.getElementById( 'nicknameText' )
              .innerText = 'You are anonymous. Click here to change nickname.';
          }
        }, function ( error ) {
          console.error( "Error: couldn't find nickname.", error );
          document.getElementById( 'nicknameText' )
            .innerText = 'You are anonymous. Click here to change nickname.';
        } );

      firebase.database()
        .ref( 'users/' + userID )
        .update( {
          room: 'lobby'
        } )
        .catch( function ( error ) {
          console.error( "Error: couldn't update room.", error );
          return;
        } );

      firebase.database()
        .ref( 'users/' + userID )
        .onDisconnect()
        .update( {
          room: 'lobby'
        } )
        .catch( function ( error ) {
          console.error( "Error: couldn't update room.", error );
        } );
    } else {
      userID = null;
    }
  } );


// REFERENCE AND SETUP FUNCTIONS

// Create a list of the frequencies of all notes on the keyboard.
// It handles the repetition of the row couples.
// The frequencies are ordered in the array like the button IDs in the HTML.
function createFreqList() {
  // A3, at top left of the keyboard
  freqList[ 0 ] = 220.000000000000000;

  for ( let i = 1; i < 25; i++ ) {
    freqList[ i ] = freqList[ i - 1 ] * Math.pow( 2, 1 / 12 );
  }
}

// Create a list of all scales.
function createScaleList() {
  scaleList[ 0 ] = [];
  scaleList[ 1 ] = [ 'C', 'D', 'E', 'F', 'G', 'A', 'B' ];
  scaleList[ 2 ] = [ 'C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C' ];
  scaleList[ 3 ] = [ 'D', 'E', 'F#', 'G', 'A', 'B', 'C#' ];
  scaleList[ 4 ] = [ 'D#', 'F', 'G', 'G#', 'A#', 'C', 'D' ];
  scaleList[ 5 ] = [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D#' ];
  scaleList[ 6 ] = [ 'F', 'G', 'A', 'A#', 'C', 'D', 'E' ];
  scaleList[ 7 ] = [ 'F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F' ];
  scaleList[ 8 ] = [ 'G', 'A', 'B', 'C', 'D', 'E', 'F#' ];
  scaleList[ 9 ] = [ 'G#', 'A#', 'C', 'C#', 'D#', 'F', 'G' ];
  scaleList[ 10 ] = [ 'A', 'B', 'C#', 'D', 'E', 'F#', 'G#' ];
  scaleList[ 11 ] = [ 'A#', 'C', 'D', 'D#', 'F', 'G', 'A' ];
  scaleList[ 12 ] = [ 'B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#' ];
}

// Create a list of common cadenzas.
// N.B. since they're indexes, you have to -1 from every element of the cadenza.
function createSequenceList() {
  sequenceList[ 0 ] = [ 0, 1, 4 ];
  sequenceList[ 1 ] = [ 0, 3, 4 ];
  sequenceList[ 2 ] = [ 0, 5, 1, 4 ];
  sequenceList[ 3 ] = [ 0, 5, 3, 4 ];
  sequenceList[ 4 ] = [ 0, 4, 5, 3 ];
  sequenceList[ 5 ] = [ 3, 4, 5, 4 ];
  sequenceList[ 6 ] = [ 0, 3, 5, 4 ];
  sequenceList[ 7 ] = [ 0, 4, 3, 4 ];
  sequenceList[ 8 ] = [ 0, 4, 5, 2, 3 ];
  sequenceList[ 9 ] = [ 0, 4, 5, 2, 3, 0, 3, 4 ];
}

// Generic settings for the compressor.
// It's there so the audio doesn't clip when playing multiple notes.
function compressorSetUp() {
  compressor.threshold.setValueAtTime( -10, audioContext.currentTime );
  compressor.knee.setValueAtTime( 10, audioContext.currentTime );
  compressor.ratio.setValueAtTime( 20, audioContext.currentTime );
  compressor.attack.setValueAtTime( 0, audioContext.currentTime );
  compressor.release.setValueAtTime( 0.1, audioContext.currentTime );
  compressor.connect( audioContext.destination );
}

function loadJSON( callback, filename ) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType( 'application/json' );
  xobj.open( 'GET', filename, true );
  xobj.onreadystatechange = function () {
    if ( xobj.readyState == 4 && xobj.status == '200' ) {
      callback( xobj.responseText );
    }
  };
  xobj.send( null );
}


// SYNTH MANAGEMENT FUNCTIONS

// Finds the key that was pressed, starts the appropriate synth, and
// changes the interface to show the pressed button.
function handleNoteStart( code ) {
  let button = document.querySelector( '[data-code="' + code + '"]' );

  if ( button == null ) {
    return;
  };

  startTone( button.dataset[ 'id' ] );

  button.classList.add( 'pressed' );
}

// Finds the key that was released, stops the corresponding synth, and resets
// the interface.
function handleNoteStop( code ) {
  let button = document.querySelector( '[data-code="' + code + '"]' );

  if ( button == null ) {
    return;
  };

  stopTone( button.dataset[ 'id' ] );

  button.classList.remove( 'pressed' );
}

// Starts a new synth, setting the waveform and frequency.
function startTone( i ) {
  if ( oscList[ i ] !== null ) {
    return;
  };

  oscList[ i ] = audioContext.createOscillator();
  lpfList[ i ] = audioContext.createBiquadFilter();
  gainList[ i ] = audioContext.createGain();

  oscList[ i ].connect( lpfList[ i ] );
  lpfList[ i ].connect( gainList[ i ] );
  gainList[ i ].connect( compressor );

  oscList[ i ].type = 'square';
  oscList[ i ].frequency.value = freqList[ i ];

  lpfList[ i ].type = 'highshelf';
  lpfList[ i ].frequency.setValueAtTime( 1000, audioContext.currentTime );
  lpfList[ i ].gain.setValueAtTime( -10, audioContext.currentTime );
  lpfList[ i ].gain.linearRampToValueAtTime( -10, audioContext.currentTime + 0.15 );
  lpfList[ i ].gain.linearRampToValueAtTime( -30, audioContext.currentTime + 0.4 );

  gainList[ i ].gain.setValueAtTime( 0, audioContext.currentTime );
  gainList[ i ].gain.linearRampToValueAtTime( 0.4, audioContext.currentTime + 0.15 );
  gainList[ i ].gain.linearRampToValueAtTime( 0.3, audioContext.currentTime + 0.4 );

  oscList[ i ].start();
}

// Stops the playing synth.
function stopTone( i ) {
  if ( oscList[ i ] !== null ) {
    gainList[ i ].gain.linearRampToValueAtTime( 0, audioContext.currentTime + 0.2 );
    oscList[ i ].stop( audioContext.currentTime + 0.2 );
    oscList[ i ] = null;
  }
}

function playChord( mode ) {
  if ( mode > 6 || playChordSelected == false ) {
    return;
  };

  let first = document.getElementsByClassName( numerals[ ( 0 + mode ) % 7 ] );
  let third = document.getElementsByClassName( numerals[ ( 2 + mode ) % 7 ] );
  let fifth = document.getElementsByClassName( numerals[ ( 4 + mode ) % 7 ] );

  let lowestFirst = 99;
  let highestFirst = -1;

  [].forEach.call( first, function ( f ) {

    if ( !f || !f.parentNode.classList || !f.parentNode.classList.contains( 'key' ) ) {
      return;
    }

    let key = f.parentNode;
    handleNoteStart( key.dataset[ 'code' ] );
    ( function ( key ) {
      setTimeout( function () {
        handleNoteStop( key.dataset[ 'code' ] );
      }, 500 );
    } )( key );

    if ( lowestFirst > +f.parentNode.dataset[ 'id' ] ) {
      lowestFirst = +f.parentNode.dataset[ 'id' ];
    }
    if ( highestFirst < +f.parentNode.dataset[ 'id' ] ) {
      highestFirst = +f.parentNode.dataset[ 'id' ];
    }
  } );

  [].forEach.call( third, function ( t ) {
    if ( !t || !t.parentNode.classList || !t.parentNode.classList.contains( 'key' ) ) {
      return;
    }
    let key = t.parentNode;
    if ( key.dataset[ 'id' ] < lowestFirst || key.dataset[ 'id' ] > highestFirst ) {
      return;
    }
    handleNoteStart( key.dataset[ 'code' ] );
    ( function ( key ) {
      setTimeout( function () {
        handleNoteStop( key.dataset[ 'code' ] );
      }, 500 );
    } )( key );
  } );

  [].forEach.call( fifth, function ( f ) {
    if ( !f || !f.parentNode.classList || !f.parentNode.classList.contains( 'key' ) ) {
      return;
    }
    let key = f.parentNode;
    if ( key.dataset[ 'id' ] < lowestFirst || key.dataset[ 'id' ] > highestFirst ) {
      return;
    }
    handleNoteStart( key.dataset[ 'code' ] );
    ( function ( key ) {
      setTimeout( function () {
        handleNoteStop( key.dataset[ 'code' ] );
      }, 500 );
    } )( key );
  } );

}


// COLORED INTERFACE FUNCTIONS

// Changes the scale in response to an action on the slider.
function changeScale( value ) {
  if ( isNaN( value ) ) {
    return;
  };
  value = +value;

  if ( value < 13 && value >= 0 ) {
    scale = scaleList[ value ];
  } else {
    return;
  };

  currentScaleIndex = value;

  playedSequence = [];

  renderScale();

  document.getElementById( 'scaleSlider' )
    .value = value;

  if ( scale[ 0 ] ) {
    document.getElementById( 'scaleLabel' )
      .innerText = 'Scale: ' + scale[ 0 ];
  } else {
    document.getElementById( 'scaleLabel' )
      .innerText = 'Scale: none';
  }
}

// Changes the mode according to the selected mechanic.
function changeMode( code ) {
  if ( modeMechanic == 'None' ) {
    return;
  };

  if ( code == 'Space' ) {
    currentModeIndex = ( currentModeIndex + 1 ) % selectedSequence.length;
  } else {
    let number = code.match( /\d+$/ );

    if ( number == null ) {
      return;
    };

    number = parseInt( number[ 0 ], 10 );
    if ( number > selectedSequence.length ) {
      return;
    };

    currentModeIndex = number - 1;
    if ( currentModeIndex == -1 ) {
      currentModeIndex = 0
    };
  };

  renderMode();
  handleChordProgression();
  playChord( selectedSequence[ currentModeIndex ] );
}

// Changes the mode mechanic in response to an action on the tick boxes.
function changeModeMechanic( value ) {
  modeMechanic = value;
  currentModeIndex = -1;
  currentSequenceIndex = 0;

  switch ( modeMechanic ) {
    case 'None':
      selectedSequence = [];
      document.getElementById( 'sequenceBox' )
        .style.display = 'none';
      break;
    case 'Free':
      selectedSequence = [ 0, 1, 2, 3, 4, 5, 6 ];
      document.getElementById( 'sequenceBox' )
        .style.display = 'table';
      break;
    case 'Template':
      selectedSequence = sequenceList[ 0 ];
      document.getElementById( 'sequenceBox' )
        .style.display = 'table';
      break;
    default:
      return;
  }

  playedSequence = [];

  [].forEach.call( document.getElementById( 'mechanicCheckBoxes' )
    .childNodes,
    function ( box ) {
      if ( box.type == 'input' ) {
        box.checked = false;
        if ( box.value == value ) {
          box.checked = true;
        }
      }
    } );

  renderSequence();
}

// Clear the tags from all colored markers and assign them again according to
// the selected scale.
// It includes the next function, renderMode.
function renderScale() {
  // Remove color classes.
  let divs = document.querySelectorAll( '.mode' );
  divs.forEach( function ( div ) {
    if ( !div.id.startsWith( 'mode' ) ) {
      numerals.forEach( function ( numeral ) {
        div.classList.remove( numeral );
      } );
    }
  } );

  [].forEach.call( document.getElementsByClassName( 'key' ), function ( key ) {
    for ( i = 0; i < scale.length; i++ ) {
      let keyNote = key.getElementsByClassName( 'ENGnote' )[ 0 ];
      keyNote = keyNote.innerHTML;
      keyNote = keyNote.replace( '<small>#</small>', '#' );
      if ( scale[ i ] == keyNote ) {
        key.getElementsByClassName( 'mode' )[ 0 ].classList.add( numerals[ i ] );
      }
    }
  } );

  renderMode();
}

// Clear the highlights from all colored markers and assigns them again
// according to the selected mode.
function renderMode() {
  // Reset all markers on the keyboard to selected,
  let divs = document.querySelectorAll( '.mode' );
  divs.forEach( function ( div ) {
    div.classList.remove( 'unselected' );
  } );

  // Reset all markers in the modeBox to unselected,
  divs = document.querySelectorAll( '[id^="mode"]' );
  divs.forEach( function ( div ) {
    div.classList.add( 'unselected' );
  } );

  // Select the cursor in the modeBox,
  let cursor = document.querySelector( '[id="mode' + currentModeIndex + '"]' );
  if ( cursor != null ) {
    cursor.classList.remove( 'unselected' );
  }

  // Unselect every second, fourth, sixth, and seventh on the keyboard.
  let markerlist = document.evaluate( '//div[text()="' + scale[ ( 1 + selectedSequence[ currentModeIndex ] ) % 7 ] +
    '" or text()="' + scale[ ( 3 + selectedSequence[ currentModeIndex ] ) % 7 ] +
    '" or text()="' + scale[ ( 5 + selectedSequence[ currentModeIndex ] ) % 7 ] +
    '" or text()="' + scale[ ( 6 + selectedSequence[ currentModeIndex ] ) % 7 ] +
    '"]', document,
    null, XPathResult.ANY_TYPE, null );
  let markers = [];
  markers[ 0 ] = markerlist.iterateNext();
  while ( markers[ markers.length - 1 ] != null ) {
    markers[ markers.length ] = markerlist.iterateNext();
  }
  markers.pop();

  markers.forEach( function ( marker ) {
    marker.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'unselected' );
  } );
  renderFakePage();

  broadcastSettings();
}

// Change the sequence according to the selected mechanic.
function renderSequence() {
  // Empty the sequence box.
  let box = document.getElementById( 'sequenceBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }

  if ( modeMechanic == 'Template' ) {
    let div = document.createElement( 'div' );
    div.classList.add( 'leftArrow' );
    div.addEventListener( 'click', ( event ) => {
      currentSequenceIndex = currentSequenceIndex - 1;
      if ( currentSequenceIndex < 0 ) {
        currentSequenceIndex = sequenceList.length - 1
      }
      currentModeIndex = -1;

      selectedSequence = sequenceList[ currentSequenceIndex ];

      renderSequence();
      handleChordProgression();
    } );
    box.appendChild( div );
  }

  // Add every element of the sequence.
  for ( i = 0; i < selectedSequence.length; i++ ) {
    let element = document.createElement( 'span' );
    let label = document.createElement( 'div' );
    let arrowFillC = document.createElement( 'div' );
    let arrowOutlineC = document.createElement( 'div' );
    let arrowFillE = document.createElement( 'div' );
    let arrowOutlineE = document.createElement( 'div' );

    label.id = 'mode' + i;
    label.classList.add( 'sequenceLabel' );
    label.classList.add( 'mode' );
    label.classList.add( numerals[ selectedSequence[ i ] ] );

    arrowFillC.classList.add( 'percentageFill', 'consonance' );
    arrowOutlineC.classList.add( 'percentageOutline' );
    arrowFillE.classList.add( 'percentageFill', 'expectation' );
    arrowOutlineE.classList.add( 'percentageOutline' );

    element.classList.add( 'sequenceElement' );
    element.dataset.mode = numerals[ selectedSequence[ i ] ];

    ( function ( i ) {
      element.addEventListener( 'mousedown', ( event ) => {
        handleLocalEvent( 'keydown', 'Numpad' + ( i + 1 ), event.timeStamp );
      } );
      element.addEventListener( 'mouseup', ( event ) => {
        handleLocalEvent( 'keyup', 'Numpad' + ( i + 1 ), event.timeStamp );
      } );
      element.addEventListener( 'mouseleave', ( event ) => {
        handleLocalEvent( 'keyup', 'Numpad' + ( i + 1 ), event.timeStamp );
      } );
    } )( i );

    arrowFillC.appendChild( arrowOutlineC );
    element.appendChild( arrowFillC );

    label.appendChild( document.createTextNode( numerals[ selectedSequence[ i ] ] ) );
    element.appendChild( label );

    arrowFillE.appendChild( arrowOutlineE );
    element.appendChild( arrowFillE );

    box.appendChild( element );
  }

  if ( modeMechanic == 'Template' ) {
    let div = document.createElement( 'div' );
    div.classList.add( 'rightArrow' );
    div.addEventListener( 'click', ( event ) => {
      currentSequenceIndex = ( currentSequenceIndex + 1 ) % sequenceList.length;
      currentModeIndex = -1;

      selectedSequence = sequenceList[ currentSequenceIndex ];

      renderSequence();
      handleChordProgression();
    } );
    box.appendChild( div );
  }

  renderMode();
}

function skewPage() {
  let page = document.getElementById( 'page' );

  if ( settingBoxIsVisible ) {

    let fakePage = document.getElementById( 'fakePage' );
    let fakePage2 = fakePage.cloneNode( true );
    fakePage.parentNode.replaceChild( fakePage2, fakePage );

    fakePage2.style.animation = 'skew 0.5s ease-in reverse';

    window.setTimeout( function () {
      page.style.display = 'block';
      page.parentNode.removeChild( fakePage2 );
    }, 500 );

  } else {

    let fakePage = page.cloneNode( true );
    page.parentNode.appendChild( fakePage );

    page.scrollTop = 0;
    page.style.display = 'none';

    fakePage.id = 'fakePage';
    fakePage.style.animation = 'skew 0.5s ease-in forwards';
    fakePage.scrollTop = 0;
    fakePage.style.overflow = 'hidden';
    fakePage.getElementsByClassName( 'menuIcon' )[ 0 ].classList.add( 'clickedMenuIcon' );
  }

  settingBoxIsVisible = !settingBoxIsVisible;
}

function renderFakePage() {
  let fakePage = document.getElementById( 'fakePage' );
  if ( fakePage ) {
    let page = document.getElementById( 'page' );
    let fakePage2 = page.cloneNode( true );
    fakePage2.id = 'fakePage';
    fakePage2.style.display = 'block';
    fakePage2.style.animation = 'skew 0s forwards';
    fakePage2.scrollTop = 0;
    fakePage2.style.overflow = 'hidden';
    fakePage2.getElementsByClassName( 'menuIcon' )[ 0 ].classList.add( 'clickedMenuIcon' );
    fakePage.parentNode.replaceChild( fakePage2, fakePage );
  }
}

function toggleTensionBox() {
  tensionBoxIsVisible = !tensionBoxIsVisible;

  document.getElementById( 'tensionBox' )
    .style.display = ( tensionBoxIsVisible ) ? 'block' : 'none';

  renderFakePage();

  broadcastSettings();
}

function toggleOnlineBox() {
  onlineBoxIsVisible = !onlineBoxIsVisible;

  document.getElementById( 'onlineBox' )
    .style.display = ( onlineBoxIsVisible ) ? 'block' : 'none';

  renderFakePage();
}

function toggleChatOverlay() {
  if ( chatOverlayIsVisible ) {
    document.getElementById( 'chatOverlay' )
      .style.display = 'none';
    document.getElementById( 'viewChatText' )
      .innerHTML = 'Open full chat';
    chatOverlayIsVisible = false;
  } else {
    document.getElementById( 'chatOverlay' )
      .style.display = 'block';
    document.getElementById( 'viewChatText' )
      .innerHTML = 'Close full chat';
    if ( inTutorial ) {
      document.getElementById( 'chatOverlayInput' )
        .style.display = 'none';
    } else {
      document.getElementById( 'chatOverlayInput' )
        .style.display = 'block';
      document.getElementById( 'writeMessage' )
        .focus();
    }
    chatOverlayIsVisible = true;
    updateChatScroll();
  }
}


// TENSION AND FEELING FUNCTIONS

function alertFeeling( feeling, intensity ) {
  let svg = document.getElementById( 'feelingSVG' );
  let wave = document.getElementById( 'feeling' );

  wave.classList.add( 'standalone' );

  let lowpoint1 = svg.createSVGPoint();
  let lowpoint2 = svg.createSVGPoint();
  let highpoint1 = svg.createSVGPoint();
  let highpoint2 = svg.createSVGPoint();
  lowpoint1.x = 27.5;
  lowpoint1.y = 50 + intensity * 5;
  highpoint1.x = 50;
  highpoint1.y = 50 - intensity * 5;
  lowpoint2.x = 70;
  lowpoint2.y = 50 + intensity * 2;
  highpoint2.x = 87.5;
  highpoint2.y = 50 - intensity * 2;

  wave.points.replaceItem( lowpoint1, 2 );
  wave.points.replaceItem( highpoint1, 3 );
  wave.points.replaceItem( lowpoint2, 4 );
  wave.points.replaceItem( highpoint2, 5 );

  wave.parentNode.replaceChild(
    wave.cloneNode( true ),
    wave
  );

  let text = document.getElementById( 'feelingText' );
  text.innerHTML = feeling;
  text.style.fontWeight = intensity * 90;
  text.style.fontSize = 20 + intensity * 2;
  text.setAttribute( 'x', 80 - intensity * 7 );
  text.setAttribute( 'y', 53 + intensity / 1.5 );

  // The text is reinserted as a new element so that the transition
  // from opacity 0 to 1 is instantaneous, while from 1 to 0 it is slow.
  text.parentNode.replaceChild(
    text.cloneNode( true ),
    text
  );
  text = document.getElementById( 'feelingText' );

  text.style.opacity = 1;
  window.setTimeout( function () {
    text.style.opacity = 0;
  }, 2000 );

}

function changeTension( intensity ) {
  let svg = document.getElementById( 'tensionSVG' );
  let waveBack = document.getElementById( 'tensionBack' );
  let waveFront = document.getElementById( 'tensionFront' );

  svg.classList.remove( 'I', 'IV', 'V' );
  switch ( intensity ) {
    case 0:
    case 1:
      svg.classList.add( 'I' );
      break;
    case 2:
    case 3:
      svg.classList.add( 'IV' );
      break;
    case 4:
    case 5:
    default:
      svg.classList.add( 'V' );
      break;
  }

  let lowpoint1 = svg.createSVGPoint();
  let lowpoint2 = svg.createSVGPoint();
  let highpoint1 = svg.createSVGPoint();
  let highpoint2 = svg.createSVGPoint();
  lowpoint1.x = 27.5;
  lowpoint1.y = 50 + intensity * 5;
  highpoint1.x = 50;
  highpoint1.y = 50 - intensity * 5;
  lowpoint2.x = 70;
  lowpoint2.y = 50 + intensity * 2;
  highpoint2.x = 87.5;
  highpoint2.y = 50 - intensity * 2;

  waveBack.points.replaceItem( lowpoint1, 2 );
  waveBack.points.replaceItem( highpoint1, 3 );
  waveBack.points.replaceItem( lowpoint2, 4 );
  waveBack.points.replaceItem( highpoint2, 5 );

  waveFront.points.replaceItem( lowpoint1, 2 );
  waveFront.points.replaceItem( highpoint1, 3 );
  waveFront.points.replaceItem( lowpoint2, 4 );
  waveFront.points.replaceItem( highpoint2, 5 );
}

function handleChordProgression() {
  if ( currentModeIndex < 0 ) {
    playedSequence = [];
    return;
  }
  if ( !playedSequence ) {
    playedSequence = [];
  }
  if ( playedSequence[ playedSequence.length - 1 ] == numerals[ selectedSequence[ currentModeIndex ] ] ) {
    return;
  };

  playedSequence.push( numerals[ selectedSequence[ currentModeIndex ] ] );

  let expectation = null;
  if ( expectationPrediction ) {
    expectation = expectationPrediction[ playedSequence[ playedSequence.length - 1 ] ];
  }
  //consonance
  /*
    let consonance = null;
    if ( consonancePrediction ) {
      consonance = consonancePrediction[ numerals[ selectedSequence[ currentModeIndex ] ] ];
    }
  */

  let tension = 0;
  switch ( playedSequence[ playedSequence.length - 1 ] ) {
    case 'I':
      break;
    case 'III':
    case 'VI':
      tension = 1;
      break;
    case 'II':
    case 'IV':
      tension = 3;
      break;
    case 'V':
    case 'VII':
      tension = 5;
      break;
  }
  changeTension( tension );

  let feeling = null;
  if ( expectation < expectationThreshold ) {
    feeling = 'Surprise';
  }
  if ( tension < previousTension - 2 ) {
    feeling = 'Resolution';
  }
  /*
  if ( consonance < consonanceThreshold ) {
    feeling = 'Dissonance';
  } else {
    if ( expectation < expectationThreshold ) {
      feeling = 'Surprise';
    }
    if ( tension < previousTension - 2 ) {
      feeling = 'Resolution';
    }
  }
  */
  if ( feeling ) {
    alertFeeling( feeling, 5 );
  }

  previousTension = tension;

  while ( playedSequence.length > maxSequenceMemory ) {
    playedSequence.shift();
  }

  consonancePrediction = getNextChord( 1 );
  if ( showConsonance ) {
    [].forEach.call( document.getElementsByClassName( 'sequenceElement' ), function ( progEl ) {
      let num = progEl.dataset[ 'mode' ];
      if ( consonancePrediction && consonancePrediction[ num ] ) {
        let percentage = consonancePrediction[ num ];
        let rotation = 90 - Math.round( 90 * percentage / 100 );
        //let rotation = 90 - Math.round( 60 * Math.sqrt( percentage / 100 ) );
        progEl.childNodes[ 0 ].style.transform = "rotate(135deg) rotate3d(1, -1, 0, " + rotation + "deg)";
        progEl.childNodes[ 0 ].style.display = 'block';
      } else {
        progEl.childNodes[ 0 ].style.display = 'none';
      }
    } );
  }

  expectationPrediction = getNextChord( playedSequence.length );
  if ( showExpectation ) {
    [].forEach.call( document.getElementsByClassName( 'sequenceElement' ), function ( progEl ) {
      let num = progEl.dataset[ 'mode' ];
      if ( expectationPrediction && expectationPrediction[ num ] ) {
        let percentage = expectationPrediction[ num ];
        let rotation = 90 - Math.round( 90 * percentage / 100 );
        //let rotation = 90 - Math.round( 60 * Math.sqrt( percentage / 100 ) );
        progEl.childNodes[ 2 ].style.transform = "rotate(-45deg) rotate3d(1, -1, 0, " + rotation + "deg)";
        progEl.childNodes[ 2 ].style.display = 'block';
      } else {
        progEl.childNodes[ 2 ].style.display = 'none';
      }
    } );
  }
}

function getNextChord( consideredHistory ) {

  let playedSequenceString = playedSequence[ playedSequence.length - consideredHistory ];
  for ( i = consideredHistory - 1; i > 0; i-- ) {
    playedSequenceString = playedSequenceString + ' ' + playedSequence[ playedSequence.length - i ];
  }

  let probabilities = firstChord;
  switch ( consideredHistory ) {
    case 0:
      return probabilities;
    case 1:
      probabilities = secondChord[ playedSequenceString ];
      break;
    case 2:
      probabilities = thirdChord[ playedSequenceString ];
      break;
    case 3:
      probabilities = fourthChord[ playedSequenceString ];
      break;
    case 4:
      probabilities = fifthChord[ playedSequenceString ];
      break;
    case 5:
      probabilities = sixthChord[ playedSequenceString ];
      break;
    case 6:
      probabilities = seventhChord[ playedSequenceString ];
      break;
    case 7:
      probabilities = eighthChord[ playedSequenceString ];
      break;
    case 8:
      probabilities = ninthChord[ playedSequenceString ];
      break;
    case 9:
      probabilities = tenthChord[ playedSequenceString ];
      break;
    default:
      return null;
  }

  if ( !probabilities ) { // Fall back to "shorter" layer if there aren't any predictions from this one.
    return getNextChord( consideredHistory - 1 );
  }
  probabilities = JSON.parse( JSON.stringify( probabilities ) );

  let size = 0;
  for ( let record in probabilities ) {
    if ( probabilities.hasOwnProperty( record ) ) size++;
  }

  if ( size < 5 ) { // Fall back to "shorter" layer if there aren't enough possibilities from this one.
    return getNextChord( consideredHistory - 1 );
  }

  // For comparing each probability to the base probability of the standalone mode
  if ( probabilities ) {
    numerals.forEach( function ( num ) {
      probabilities[ num ] = ( 100 / 7 ) * probabilities[ num ] / firstChord[ num ];
      if ( probabilities[ num ] > 100 ) {
        probabilities[ num ] = 100;
      }
    } );
  }

  // For computing the mean of all suggestions
  /*
    probabilities = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      'V': 0,
      'VI': 0,
      'VII': 0
    };
    let temp = 0;

    console.log( probabilities );

    numerals.forEach( function ( num ) {

      switch ( playedSequence.length ) {
        case 7:
          temp = eighthChord[
            playedSequence[ 0 ] + ' ' +
            playedSequence[ 1 ] + ' ' +
            playedSequence[ 2 ] + ' ' +
            playedSequence[ 3 ] + ' ' +
            playedSequence[ 4 ] + ' ' +
            playedSequence[ 5 ] + ' ' +
            playedSequence[ 6 ] ];
          if ( temp && temp[ num ] ) {
            nextChord[ num ] = probabilities[ num ] + temp[ num ];
          }
        case 6:
          temp = seventhChord[
            playedSequence[ 0 ] + ' ' +
            playedSequence[ 1 ] + ' ' +
            playedSequence[ 2 ] + ' ' +
            playedSequence[ 3 ] + ' ' +
            playedSequence[ 4 ] + ' ' +
            playedSequence[ 5 ] ];
          if ( temp && temp[ num ] ) {
            probabilities[ num ] = probabilities[ num ] + temp[ num ];
          }
        case 5:
          temp = sixthChord[
            playedSequence[ 0 ] + ' ' +
            playedSequence[ 1 ] + ' ' +
            playedSequence[ 2 ] + ' ' +
            playedSequence[ 3 ] + ' ' +
            playedSequence[ 4 ] ];
          if ( temp && temp[ num ] ) {
            probabilities[ num ] = probabilities[ num ] + temp[ num ];
          }
        case 4:
          temp = fifthChord[
            playedSequence[ 0 ] + ' ' +
            playedSequence[ 1 ] + ' ' +
            playedSequence[ 2 ] + ' ' +
            playedSequence[ 3 ] ];
          if ( temp && temp[ num ] ) {
            probabilities[ num ] = probabilities[ num ] + temp[ num ];
          }
        case 3:
          temp = fourthChord[
            playedSequence[ 0 ] + ' ' +
            playedSequence[ 1 ] + ' ' +
            playedSequence[ 2 ] ];
          if ( temp && temp[ num ] ) {
            probabilities[ num ] = probabilities[ num ] + temp[ num ];
          }
        case 2:
          temp = thirdChord[
            playedSequence[ 0 ] + ' ' +
            playedSequence[ 1 ] ];
          if ( temp && temp[ num ] ) {
            probabilities[ num ] = probabilities[ num ] + temp[ num ];
          }
        case 1:
          temp = secondChord[
            playedSequence[ 0 ] ];
          if ( temp && temp[ num ] ) {
            probabilities[ num ] = probabilities[ num ] + temp[ num ];
          }
          break;
        default:
      }
      probabilities[ num ] = probabilities[ num ] / playedSequence.length;
    } );
  */

  // Rounded probabilities
  /*
  console.log( '\n' );
  numerals.forEach( function ( num ) {
    console.log( num + '\t' + Math.round( probabilities[ num ] ) );
  } );
  */

  // Convert null entries to 0
  numerals.forEach( function ( num ) {
    if ( !probabilities[ num ] ) {
      probabilities[ num ] = 0
    };
  } );

  return probabilities;
}


// ROOM FUNCTIONS

function createRoom() {

  if ( roomName || !userID ) {
    return;
  };
  roomName = prompt( 'Enter the room name' );
  if ( !roomName ) {
    return;
  };

  firebase.database()
    .ref( 'rooms/' + roomName + '/owner' )
    .set( userID )
    .then( function () {

        let promises = [];

        promises.push(
          firebase.database()
          .ref( 'users/' + userID )
          .update( {
            room: roomName
          } )
        );
        promises.push(
          firebase.database()
          .ref( 'messages/' + roomName )
          .push( {
            admin: true,
            nickname: myNickname,
            user: userID,
            text: 'Created the room.'
          } )
        );
        promises.push(
          firebase.database()
          .ref( 'settings/' + roomName )
          .set( {
            scale: currentScaleIndex,
            mechanic: modeMechanic,
            mode: currentModeIndex,
            sequence: currentSequenceIndex,
            tensionVisible: tensionBoxIsVisible
          } )
        );

        Promise.all( promises )
          .then( function () {

              let morePromises = [];

              morePromises.push(
                firebase.database()
                .ref( 'rooms/' + roomName )
                .onDisconnect()
                .remove()
              );
              morePromises.push(
                firebase.database()
                .ref( 'messages/' + roomName )
                .onDisconnect()
                .remove()
              );
              morePromises.push(
                firebase.database()
                .ref( 'settings/' + roomName )
                .onDisconnect()
                .remove()
              );
              morePromises.push(
                firebase.database()
                .ref( 'keypresses/' + roomName )
                .onDisconnect()
                .remove()
              );

              Promise.all( morePromises )
                .then( function () {

                  let box = document.getElementById( 'roomsBox' );
                  while ( box.firstChild ) {
                    box.removeChild( box.firstChild );
                  }

                  let leaveButton = document.createElement( 'button' );
                  leaveButton.appendChild( document.createTextNode( 'Leave room' ) );
                  leaveButton.addEventListener( 'click', ( event ) => {
                    leaveRoom()
                  } );
                  leaveButton.classList.add( 'leave' );

                  box.appendChild( document.createTextNode( 'You are admin of room: ' + roomName ) );
                  box.appendChild( document.createElement( 'br' ) );
                  box.appendChild( leaveButton );

                  iAmAdmin = true;

                  playedSequence = [];

                  updateChatListener();
                }, function ( error ) {
                  console.error( "Error: couldn't create room.", error );

                  let lastPromises = [];

                  lastPromises.push(
                    firebase.database()
                    .ref( 'rooms/' + roomName )
                    .remove()
                  );
                  lastPromises.push(
                    firebase.database()
                    .ref( 'messages/' + roomName )
                    .remove()
                  );
                  lastPromises.push(
                    firebase.database()
                    .ref( 'settings/' + roomName )
                    .remove()
                  );
                  lastPromises.push(
                    firebase.database()
                    .ref( 'keypresses/' + roomName )
                    .remove()
                  );

                  Promise.all( lastPromises )
                    .catch(
                      function ( error ) {
                        console.error( "Error: couldn't rollback...", error );
                      } );
                } );
            },
            function ( error ) {
              console.error( "Error: couldn't create room.", error );

              let lastPromises = [];

              lastPromises.push(
                firebase.database()
                .ref( 'rooms/' + roomName )
                .remove()
              );
              lastPromises.push(
                firebase.database()
                .ref( 'messages/' + roomName )
                .remove()
              );
              lastPromises.push(
                firebase.database()
                .ref( 'settings/' + roomName )
                .remove()
              );
              lastPromises.push(
                firebase.database()
                .ref( 'keypresses/' + roomName )
                .remove()
              );

              Promise.all( lastPromises )
                .catch(
                  function ( error ) {
                    console.error( "Error: couldn't rollback...", error );
                  } );
            } );
      },
      function ( error ) {
        console.error( "Error: couldn't create room.", error );

        let lastPromises = [];

        lastPromises.push(
          firebase.database()
          .ref( 'rooms/' + roomName )
          .remove()
        );
        lastPromises.push(
          firebase.database()
          .ref( 'messages/' + roomName )
          .remove()
        );
        lastPromises.push(
          firebase.database()
          .ref( 'settings/' + roomName )
          .remove()
        );
        lastPromises.push(
          firebase.database()
          .ref( 'keypresses/' + roomName )
          .remove()
        );

        Promise.all( lastPromises )
          .catch(
            function ( error ) {
              console.error( "Error: couldn't rollback...", error );
            } );
      } );
}

function joinRoom( name ) {

  if ( roomName || !name || !userID ) {
    return;
  };

  roomName = name;

  firebase.database()
    .ref( 'users/' + userID )
    .update( {
      room: roomName
    } )
    .catch( function ( error ) {
      console.error( "Error: couldn't enter room.", error );
      roomName = null;
      return;
    } );

  let box = document.getElementById( 'roomsBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }

  let leaveButton = document.createElement( 'button' );
  leaveButton.appendChild( document.createTextNode( 'Leave room' ) );
  leaveButton.addEventListener( 'click', ( event ) => {
    leaveRoom()
  } );
  leaveButton.classList.add( 'leave' );

  box.appendChild( document.createTextNode( 'You are a guest in room: ' + roomName ) );
  box.appendChild( document.createElement( 'br' ) );
  box.appendChild( leaveButton );

  // This listener:
  // firebase.database().ref('/keypresses/' + roomName).on('child_added', listenForRemoteEvents);
  // would check all existing DB entries, including those from before we joined the room.
  // The following solves that:
  justEnteredRoom = true;
  firebase.database()
    .ref( 'keypresses/' + roomName )
    .limitToLast( 1 )
    .on( 'child_added',
      function ( snap ) {
        if ( justEnteredRoom ) {
          justEnteredRoom = false;
          return;
        }
        listenForRemoteEvents( snap, remoteEventDelay );
      } );

  playedSequence = [];

  updateChatListener();

  firebase.database()
    .ref( 'settings/' + roomName )
    .on( 'child_added',
      function ( snap ) {
        handleRemoteSettings( snap );
      } );

  firebase.database()
    .ref( 'rooms/' + roomName )
    .on( 'child_removed',
      function ( snap ) {

        console.log( 'Leaving' );

        leaveRoom();

        let box = document.getElementById( 'onlineBox' );
        let overlay = document.createElement( 'div' );
        let overlayText = document.createElement( 'div' );

        overlay.id = 'kickedOverlay';
        overlay.classList.add( 'overlay' );
        overlay.style.display = 'block';
        overlay.style.animation = 'fade 5s cubic-bezier(0.75, 0.25, 0.75, 0.25) forwards';

        overlayText.classList.add( 'overlayText' );
        overlayText.appendChild( document.createTextNode( 'You were kicked from the room.\n(admin disconnected)' ) );
        overlay.appendChild( overlayText );
        box.appendChild( overlay );

        window.setTimeout( function () {
          document.getElementById( 'onlineBox' )
            .removeChild( document.getElementById( 'kickedOverlay' ) );
        }, 5000 );
      } );
}

function leaveRoom() {

  if ( !roomName ) {
    return;
  };

  if ( iAmAdmin ) {

    if ( !confirm( 'You are the room admin. Leaving will delete the room.' ) ) {
      return;
    };

    let promises = [];

    promises.push(
      firebase.database()
      .ref( 'settings/' + roomName )
      .remove()
    );
    promises.push(
      firebase.database()
      .ref( 'keypresses/' + roomName )
      .remove()
    );
    promises.push(
      firebase.database()
      .ref( 'messages/' + roomName )
      .remove()
    );
    promises.push(
      firebase.database()
      .ref( 'users/' + userID )
      .update( {
        room: 'lobby'
      } )
    );

    Promise.all( promises )
      .then( function () {

        firebase.database()
          .ref( 'rooms/' + roomName )
          .remove()
          .catch( function ( error ) {
            console.error( "Error: couldn't delete room.", error );
          } );

        roomName = null;

        iAmAdmin = false;

        playedSequence = [];

        updateChatListener();

        updateRoomBox();

      }, function ( error ) {
        console.error( "Error: couldn't delete room.", error );
      } );
  } else {

    let promises = [];

    promises.push(
      firebase.database()
      .ref( 'rooms/' + roomName )
      .off( 'child_removed' )
    );
    promises.push(
      firebase.database()
      .ref( 'keypresses/' + roomName )
      .off( 'child_added' )
    );
    promises.push(
      firebase.database()
      .ref( 'messages/' + roomName )
      .off( 'child_added' )
    );
    promises.push(
      firebase.database()
      .ref( 'messages/' + roomName )
      .off( 'child_changed' )
    );
    promises.push(
      firebase.database()
      .ref( 'settings/' + roomName )
      .off( 'child_added' )
    );
    promises.push(
      firebase.database()
      .ref( 'users/' + userID )
      .update( {
        room: 'lobby'
      } )
    );

    Promise.all( promises )
      .then( function () {

        roomName = null;

        playedSequence = [];

        updateChatListener();

        updateRoomBox();

      }, function ( error ) {
        console.error( "Error: couldn't leave room.", error );
      } );
  }
}

function loadTutorial( name ) {

  if ( roomName || !name || inTutorial ) {
    return;
  };

  firebase.database()
    .ref( 'tutorials/data/' + name )
    .once( 'value' )
    .then( function ( snap ) {

      let box = document.getElementById( 'roomsBox' );
      while ( box.firstChild ) {
        box.removeChild( box.firstChild );
      }

      let leaveButton = document.createElement( 'button' );
      leaveButton.appendChild( document.createTextNode( 'Exit tutorial' ) );
      leaveButton.addEventListener( 'click', ( event ) => {
        exitTutorial();
      } );
      leaveButton.classList.add( 'leave' );
      box.appendChild( leaveButton );

      box.appendChild( document.createElement( 'br' ) );

      let nextButton = document.createElement( 'button' );
      nextButton.appendChild( document.createTextNode( 'Next step' ) );
      nextButton.addEventListener( 'click', ( event ) => {
        nextTutorialStep();
      } );
      nextButton.classList.add( 'step' );
      box.appendChild( nextButton );

      let repeatButton = document.createElement( 'button' );
      repeatButton.appendChild( document.createTextNode( 'Repeat step' ) );
      repeatButton.addEventListener( 'click', ( event ) => {
        repeatTutorialStep();
      } );
      repeatButton.classList.add( 'step' );
      box.appendChild( repeatButton );

      let previousButton = document.createElement( 'button' );
      previousButton.appendChild( document.createTextNode( 'Previous step' ) );
      previousButton.addEventListener( 'click', ( event ) => {
        previousTutorialStep();
      } );
      previousButton.classList.add( 'step' );
      box.appendChild( previousButton );

      tutorialStepsCount = snap.val()
        .steps;

      handleRemoteSettings( snap.child( 'settings' ) );

      let i = 0;
      tutorialKeypressSequences = [];
      tutorialKeypressSequences[ 0 ] = [];

      snap.child( 'keypresses' )
        .forEach( function ( keypressSnap ) {
          if ( keypressSnap.val()
            .code == 'Enter' ) {
            tutorialKeypressSequences[ ++i ] = [];
          } else {
            tutorialKeypressSequences[ i ].push( keypressSnap );
          }
        } );

      i = 0;
      tutorialMessages = [];

      snap.child( 'messages' )
        .forEach( function ( message ) {
          if ( message.val()
            .text ) {
            tutorialMessages[ i++ ] = message.val()
              .text;
          } else {
            tutorialMessages[ i++ ] = null;
          }
        } );

      inTutorial = true;

      updateChatListener();

      playedSequence = [];

      tutorialStep = -1;
      nextTutorialStep();
    }, function ( error ) {
      console.error( "Error: couldn't load tutorial.", error );
    } );
}

function exitTutorial() {
  if ( roomName || !inTutorial ) {
    return;
  };

  remoteEvents = [];
  clearTimeout( scheduledEvent );
  scheduledEvent = null;
  document.querySelectorAll( '.key' )
    .forEach( function ( key ) {
      handleNoteStop( key.dataset[ 'code' ] );
    } );

  inTutorial = false;
  updateRoomBox();
  updateChatListener();
}

function nextTutorialStep() {
  if ( !inTutorial || tutorialStep >= tutorialStepsCount - 1 ) {
    console.log( 'Not allowed' );
    return;
  };
  tutorialStep++;

  if ( tutorialMessages[ tutorialStep ] ) {
    let box = document.getElementById( 'chatBoxMessages' );
    let overlay = document.getElementById( 'chatOverlayMessages' );

    let message = document.createElement( 'div' );
    message.classList.add( 'message' );

    message.classList.add( 'admin' );
    message.appendChild( document.createTextNode( tutorialMessages[ tutorialStep ] ) );

    box.appendChild( message );
    overlay.appendChild( message.cloneNode( true ) );

    updateChatScroll();
  }

  remoteEvents = [];
  clearTimeout( scheduledEvent );
  scheduledEvent = null;
  document.querySelectorAll( '.key' )
    .forEach( function ( key ) {
      handleNoteStop( key.dataset[ 'code' ] );
    } );

  if ( tutorialKeypressSequences[ tutorialStep ] ) {
    tutorialKeypressSequences[ tutorialStep ].forEach( function ( keypressSnap ) {
      listenForRemoteEvents( keypressSnap, 0 );
    } );
  }
}

function repeatTutorialStep() {
  if ( !inTutorial ) {
    return;
  };

  remoteEvents = [];
  clearTimeout( scheduledEvent );
  scheduledEvent = null;
  document.querySelectorAll( '.key' )
    .forEach( function ( key ) {
      handleNoteStop( key.dataset[ 'code' ] );
    } );

  if ( tutorialKeypressSequences[ tutorialStep ] ) {
    tutorialKeypressSequences[ tutorialStep ].forEach( function ( keypressSnap ) {
      listenForRemoteEvents( keypressSnap, 0 );
    } );
  }
}

function previousTutorialStep() {
  if ( !tutorialStep || !inTutorial ) {
    console.log( 'Not allowed' );
    return;
  };
  tutorialStep--;

  if ( tutorialMessages[ tutorialStep + 1 ] ) {
    let box = document.getElementById( 'chatBoxMessages' );
    let overlay = document.getElementById( 'chatOverlayMessages' );
    box.removeChild( box.lastChild );
    overlay.removeChild( overlay.lastChild );
  }

  updateChatScroll();

  remoteEvents = [];
  clearTimeout( scheduledEvent );
  scheduledEvent = null;
  document.querySelectorAll( '.key' )
    .forEach( function ( key ) {
      handleNoteStop( key.dataset[ 'code' ] );
    } );

  if ( tutorialKeypressSequences[ tutorialStep ] ) {
    tutorialKeypressSequences[ tutorialStep ].forEach( function ( keypressSnap ) {
      listenForRemoteEvents( keypressSnap, 0 );
    } );
  }
}

function updateRoomBox() {
  firebase.database()
    .ref( 'rooms' )
    .off( 'child_added' );
  firebase.database()
    .ref( 'rooms' )
    .off( 'child_removed' );

  let box = document.getElementById( 'roomsBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }

  firebase.database()
    .ref( 'tutorials/names' )
    .once( 'value' )
    .then( function ( snap ) {

      let tutorials = snap.val();
      if ( tutorials ) {
        Object.keys( tutorials )
          .forEach( function ( tutorial ) {

            let tutorialButton = document.createElement( 'button' );
            tutorialButton.appendChild( document.createTextNode( tutorial ) );

            ( function ( tutorial ) {
              tutorialButton.addEventListener( 'click', ( event ) => {
                loadTutorial( tutorial );
              } );
            } )( tutorial );

            tutorialButton.classList.add( 'tutorial' );

            box.appendChild( tutorialButton );
          } );
      }

      box.appendChild( document.createElement( 'br' ) );

      let newButton = document.createElement( 'button' );
      newButton.appendChild( document.createTextNode( 'New room' ) );
      newButton.addEventListener( 'click', ( event ) => {
        createRoom();
      } );
      newButton.classList.add( 'create' );

      box.appendChild( newButton );

      firebase.database()
        .ref( 'rooms' )
        .on( 'child_added', function ( snap ) {

          if ( roomName || inTutorial ) {
            return;
          };

          let roomButton = document.createElement( 'button' );
          roomButton.appendChild( document.createTextNode( snap.key ) );
          ( function ( snap ) {
            roomButton.addEventListener( 'click', ( event ) => {
              joinRoom( snap.key )
            } );
          } )( snap );

          let box = document.getElementById( 'roomsBox' );
          box.appendChild( roomButton );
        } );

      firebase.database()
        .ref( 'rooms' )
        .on( 'child_removed', function ( snap ) {
          if ( roomName ) {
            return;
          };
          let roomButton = document.evaluate( '//button[text()="' + snap.key + '"]',
            document, null, XPathResult.ANY_TYPE, null );
          roomButton = roomButton.iterateNext();
          if ( roomButton ) {
            roomButton.remove();
          }
        } );
    }, function ( error ) {
      console.error( "Couldn't load tutorial names.", error );
    } );
}

function handleRemoteSettings( snap ) {
  remoteSettings = snap.val();

  changeScale( remoteSettings.scale );
  changeModeMechanic( remoteSettings.mechanic );
  if ( modeMechanic == 'Template' ) {
    selectedSequence = sequenceList[ remoteSettings.sequence ];
  }
  changeMode( 'Numpad' + remoteSettings.mode );

  document.getElementById( 'tensionCheckBox' )
    .checked = tensionBoxIsVisible = remoteSettings.tensionVisible;
  document.getElementById( 'tensionBox' )
    .style.display = ( tensionBoxIsVisible ) ? 'block' : 'none';
}

function broadcastSettings() {
  if ( roomName && iAmAdmin ) {
    firebase.database()
      .ref( 'settings/' + roomName )
      .set( {
        scale: currentScaleIndex,
        mechanic: modeMechanic,
        mode: currentModeIndex,
        sequence: currentSequenceIndex,
        tensionVisible: tensionBoxIsVisible
      } )
      .catch( function ( error ) {
        console.error( "Error: couldn't broadcast settings.", error );
      } );
  }
}


// CHAT FUNCTIONS

function updateChatListener() {
  let box = document.getElementById( 'chatBoxMessages' );
  let overlay = document.getElementById( 'chatOverlayMessages' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }
  while ( overlay.firstChild ) {
    overlay.removeChild( overlay.firstChild );
  }

  if ( roomName ) {

    firebase.database()
      .ref( 'rooms' )
      .once( 'value' )
      .then( function ( snapRoom ) {

        let promises = [];

        promises.push(
          firebase.database()
          .ref( 'messages/lobby' )
          .off()
        );
        // Just to be sure
        snapRoom.forEach( function ( room ) {
          promises.push(
            firebase.database()
            .ref( 'messages/' + room.key )
            .off()
          );

          Promise.all( promises )
            .then( function () {
              firebase.database()
                .ref( 'messages/' + roomName )
                .on( 'child_added', function ( snap ) {

                  let message = document.createElement( 'div' );
                  message.classList.add( 'message' );

                  if ( snap.val()
                    .admin ) {
                    message.classList.add( 'admin' );
                  }

                  if ( snap.val()
                    .nickname ) {
                    message.appendChild( document.createTextNode( snap.val()
                      .nickname + ' : ' + snap.val()
                      .text ) );
                  } else {
                    if ( snap.val()
                      .admin ) {
                      message.appendChild( document.createTextNode( 'Admin : ' + snap.val()
                        .text ) );
                    } else {
                      message.appendChild( document.createTextNode( 'Anonymous : ' + snap.val()
                        .text ) );
                    }
                  }

                  message.id = 'box' + snap.key;
                  box.appendChild( message );
                  let clone = message.cloneNode( true )
                  clone.id = 'overlay' + snap.key;
                  overlay.appendChild( clone );

                  updateChatScroll();
                }, function ( error ) {
                  console.error( "Couldn't load room message.", error );
                } );

              firebase.database()
                .ref( 'messages/' + roomName )
                .on( 'child_changed', function ( snap ) {

                  let boxMessage = document.getElementById( 'box' + snap.key );
                  let overlayMessage = document.getElementById( 'overlay' + snap.key );

                  boxMessage.removeChild( boxMessage.firstChild );
                  overlayMessage.removeChild( overlayMessage.firstChild );

                  if ( snap.val()
                    .nickname ) {
                    boxMessage.appendChild( document.createTextNode( snap.val()
                      .nickname + ' : ' + snap.val()
                      .text ) );
                    overlayMessage.appendChild( document.createTextNode( snap.val()
                      .nickname + ' : ' + snap.val()
                      .text ) );
                  } else {
                    if ( snap.val()
                      .admin ) {
                      boxMessage.appendChild( document.createTextNode( 'Admin : ' + snap.val()
                        .text ) );
                      overlayMessage.appendChild( document.createTextNode( 'Admin : ' + snap.val()
                        .text ) );
                    } else {
                      boxMessage.appendChild( document.createTextNode( 'Anonymous : ' + snap.val()
                        .text ) );
                      overlayMessage.appendChild( document.createTextNode( 'Anonymous : ' + snap.val()
                        .text ) );
                    }
                  }

                  updateChatScroll();

                }, function ( error ) {
                  console.error( "Couldn't load room message.", error );
                } );
            } );
        } );
      }, function ( error ) {
        console.error( "Couldn't load room names.", error );
      } );

  } else {

    firebase.database()
      .ref( 'rooms' )
      .once( 'value' )
      .then( function ( snapRoom ) {

          let promises = [];

          promises.push(
            firebase.database()
            .ref( 'messages/lobby' )
            .off()
          );
          // Just to be sure
          snapRoom.forEach( function ( room ) {
            promises.push(
              firebase.database()
              .ref( 'messages/' + room.key )
              .off()
            );
          } );

          Promise.all( promises )
            .then( function () {

              if ( !inTutorial ) {

                firebase.database()
                  .ref( 'messages/lobby' )
                  .on( 'child_added', function ( snap ) {

                    let message = document.createElement( 'div' );

                    if ( snap.val()
                      .nickname ) {
                      t = document.createTextNode( snap.val()
                        .nickname + ' : ' + snap.val()
                        .text );
                    } else {
                      t = document.createTextNode( 'Anonymous : ' + snap.val()
                        .text );
                    }

                    message.appendChild( t );
                    message.classList.add( 'message' );

                    message.id = 'box' + snap.key;
                    box.appendChild( message );
                    let clone = message.cloneNode( true )
                    clone.id = 'overlay' + snap.key;
                    overlay.appendChild( clone );

                    updateChatScroll();
                  } );

                firebase.database()
                  .ref( 'messages/lobby' )
                  .on( 'child_changed', function ( snap ) {

                    let boxMessage = document.getElementById( 'box' + snap.key );
                    let overlayMessage = document.getElementById( 'overlay' + snap.key );

                    boxMessage.removeChild( boxMessage.firstChild );
                    overlayMessage.removeChild( overlayMessage.firstChild );

                    if ( snap.val()
                      .nickname ) {
                      boxMessage.appendChild( document.createTextNode( snap.val()
                        .nickname + ' : ' + snap.val()
                        .text ) );
                      overlayMessage.appendChild( document.createTextNode( snap.val()
                        .nickname + ' : ' + snap.val()
                        .text ) );
                    } else {
                      boxMessage.appendChild( document.createTextNode( 'Anonymous : ' + snap.val()
                        .text ) );
                      overlayMessage.appendChild( document.createTextNode( 'Anonymous : ' + snap.val()
                        .text ) );
                    }

                    updateChatScroll();
                  } );
              }
            }, function ( error ) {
              console.error( "Couldn't load room names.", error );
            } );
        },
        function ( error ) {
          console.error( "Couldn't load room names.", error );
        } );
  }
}

function sendMessage() {
  if ( !userID || !document.getElementById( 'writeMessage' )
    .value ) {
    return;
  };

  let message = {
    user: userID,
    nickname: myNickname,
    admin: iAmAdmin,
    text: document.getElementById( 'writeMessage' )
      .value
  }

  if ( roomName ) {
    firebase.database()
      .ref( 'messages/' + roomName )
      .push( message )
      .catch( function ( error ) {
        console.error( "Error: couldn't send message.", error );
        return;
      } );
  } else {
    firebase.database()
      .ref( 'messages/lobby' )
      .push( message )
      .catch( function ( error ) {
        console.error( "Error: couldn't send message.", error );
        return;
      } );
  }

  document.getElementById( 'writeMessage' )
    .value = '';
}

function updateChatScroll() {
  let element = document.getElementById( 'chatBox' );
  element.scrollTop = element.scrollHeight;
  element = document.getElementById( 'chatOverlayMessages' );
  element.scrollTop = element.scrollHeight;
}

function changeNickname() {
  myNickname = prompt( 'Enter your new nickname.' );

  firebase.database()
    .ref( 'users/' + userID )
    .update( {
      nickname: myNickname
    } )
    .catch( function ( error ) {
      console.error( "Error: couldn't update nickname.", error );
    } )

  firebase.database()
    .ref( 'messages/lobby' )
    .orderByChild( 'user' )
    .equalTo( userID )
    .once( 'value' )
    .then( function ( snap ) {
      snap.forEach( function ( data ) {
        firebase.database()
          .ref( 'messages/lobby/' + data.key )
          .update( {
            nickname: myNickname
          } )
          .then( function () {
            updateChatListener();
          }, function ( error ) {
            console.error( "Error: couldn't update nickname.", error );
          } );
      } );
    } );

  firebase.database()
    .ref( 'rooms' )
    .once( 'value' )
    .then( function ( snapRoom ) {

      snapRoom.forEach( function ( room ) {

        firebase.database()
          .ref( 'messages/' + room.key )
          .orderByChild( 'user' )
          .equalTo( userID )
          .once( 'value' )
          .then( function ( snapMessage ) {

            snapMessage.forEach( function ( message ) {

              firebase.database()
                .ref( 'messages/' + roomName + '/' + message.key )
                .update( {
                  nickname: myNickname
                } )
                .then( function () {

                  updateChatListener();

                }, function ( error ) {
                  console.error( "Error: couldn't update nickname.", error );
                } );
            } );
          }, function ( error ) {
            console.error( "Error: couldn't update nickname.", error );
          } );
      } );
    }, function ( error ) {
      console.error( "Error: couldn't update nickname.", error );
    } );

  if ( myNickname ) {
    document.getElementById( 'nicknameText' )
      .innerText = 'You are ' + myNickname + '. Click here to change nickname.';
  } else {
    document.getElementById( 'nicknameText' )
      .innerText = 'You are anonymous. Click here to change nickname.';
  }
}