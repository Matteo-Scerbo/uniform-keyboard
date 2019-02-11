// VARIABLE DECLARATIONS

// These are for keeping track of what's going on.

// refers to the index along the sequence displayed under the keyboard.
var currentModeIndex = -1;
// in Progression mode, there are several available sequences.
var selectedSequenceIndex = 0;
// Can be 'None', 'Free', 'Progression'.
var modeMechanic = 'None';
// Option for hearing the chord upon selection of the mode.
var playChordSelected = false;
// Regarding the previous option, whether the seventh should be sounded.
var playSeventhSelected = false;
// 0 means no scale selected, 1 to 12 are C to B.
var currentScaleIndex = 0;
// The selected scale is stored for ease.
var currentScale = [];
// Same for the selected sequence in Progression mode.
var selectedSequence = [];
// If english note labels are displayed
var engNotesShown = true;
// If italian note labels are displayed
var itaNotesShown = false;


// These are for suggesting the harmonic sequence.

// Memory of past selected modes. Max length can be modified.
var playedSequence = [];
// Tension of the previous selected mode.
var previousTension = -1;
// Consonance of a chord with respect to the previous is guessed
// from short-memory prediction.
var consonancePrediction = [];
// Expectation of a chord with respect to the previous is guessed
// from long-memory prediction.
var expectationPrediction = [];
// Probability of each chord to appear, in general.
var firstChord;
// Probability of each chord to appear after a given one.
var secondChord;
// Probability of each chord to appear after a given sequence of two.
var thirdChord;
// So on...
var fifthChord;
var fourthChord;
var sixthChord;
var seventhChord;
var eighthChord;
var ninthChord;
var tenthChord;


// These are for playing sounds.

var audioContext = new( window.AudioContext || window.webkitAudioContext );
var compressor = audioContext.createDynamicsCompressor();
// List of oscillators: there are only 25,
// as many as there are notes on the keyboard.
var oscList = [];
// Each synth has a low pass filter in addition to the oscillator,
var lpfList = [];
// and a gain.
var gainList = [];


// These are constants for reference.

// 25 frequencies of the available notes.
var freqList = [];
// 12 possible scales.
var scaleList = [];
// Some known chord sequences.
var sequenceList = [];
var numerals = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII' ];
// 9 means using tenthChord prediction... which almost crashes the browser.
var maxSequenceMemory = 8;
// Decides what "next chord"s are considered as dissonant.
var consonanceThreshold = 100 / 14;
// Decides what "next chord"s are considered as unexpected.
var expectationThreshold = 100 / 14;


// These are for networking.

// Local user's own ID.
var userID = null;
// null unless in a room.
var roomName = null;
// null if anonymous.
var myDisplayName = null;
// Set when in a room of one's own creation.
var iAmAdmin = false;
// Time of the last local keypress.
var previousLocalTimestamp = 0;
// Array of heard keypresses from the room admin.
var remoteEvents = [];
// The next keypress scheduled for reproduction.
var scheduledEvent = null;
// This is used when entering a room to avoid
// hearing what's been played before entering.
var justEnteredRoom = false;
// The chat overlay blocks the keyboard,
// and displays all messages as well as the option
// to send a message or change displayName.
var chatOverlayIsVisible = false;


// These are for tutorials.

// true when "attending" a static tutorial.
var inTutorial = false;
// Loaded in bunch upon entering.
var tutorialKeypressSequences = [];
// Same as above.
var tutorialMessages = [];
// What step is being visualized.
var tutorialStep = 0;
// Total steps of the tutorial.
var tutorialStepsCount = 0;
// This can adjust the reproduction speed of tutorials or user uploads.
// N.B. 0.5 means half speed, 2 means double speed.
var playBackSpeed = 1;


// These are for recording.

// true while recording.
var recordingNow = false;
// An object listing keypresses.
var recordedKeypresses = {};
// Number of recorded keypresses.
var recordedKeypressesCount = 0;
// The settings associated with the current recording.
var recordingSettings = {};

// true when looking at another user's recording.
var inUserUpload = false;
// Keypresses of another user's recording.
var userUploadKeypressSequence = [];


// These are some debugging, incomplete, or advanced features.

var showConsonance = false;
var showExpectation = false;
// This delay is added to keypresses heard from the room admin.
var remoteEventDelay = 500;


// These detect the browser agent and version.
var BrowserDetect = {
  init: function () {
    this.browser = this.searchString( this.dataBrowser ) || "An unknown browser";
    this.version = this.searchVersion( navigator.userAgent ) || this.searchVersion( navigator.appVersion ) || "an unknown version";
    this.OS = this.searchString( this.dataOS ) || "an unknown OS";
  },
  searchString: function ( data ) {
    for ( var i = 0; i < data.length; i++ ) {
      var dataString = data[ i ].string;
      var dataProp = data[ i ].prop;
      this.versionSearchString = data[ i ].versionSearch || data[ i ].identity;
      if ( dataString ) {
        if ( dataString.indexOf( data[ i ].subString ) != -1 ) return data[ i ].identity;
      } else if ( dataProp ) return data[ i ].identity;
    }
  },
  searchVersion: function ( dataString ) {
    var index = dataString.indexOf( this.versionSearchString );
    if ( index == -1 ) return;
    return parseFloat( dataString.substring( index + this.versionSearchString.length + 1 ) );
  },
  dataBrowser: [ {
    string: navigator.userAgent,
    subString: "Chrome",
    identity: "Chrome"
  }, {
    string: navigator.userAgent,
    subString: "OmniWeb",
    versionSearch: "OmniWeb/",
    identity: "OmniWeb"
  }, {
    string: navigator.vendor,
    subString: "Apple",
    identity: "Safari",
    versionSearch: "Version"
  }, {
    prop: window.opera,
    identity: "Opera",
    versionSearch: "Version"
  }, {
    string: navigator.vendor,
    subString: "iCab",
    identity: "iCab"
  }, {
    string: navigator.vendor,
    subString: "KDE",
    identity: "Konqueror"
  }, {
    string: navigator.userAgent,
    subString: "Firefox",
    identity: "Firefox"
  }, {
    string: navigator.vendor,
    subString: "Camino",
    identity: "Camino"
  }, {
    string: navigator.userAgent,
    subString: "Netscape",
    identity: "Netscape"
  }, {
    string: navigator.userAgent,
    subString: "MSIE",
    identity: "Explorer",
    versionSearch: "MSIE"
  }, {
    string: navigator.userAgent,
    subString: "Gecko",
    identity: "Mozilla",
    versionSearch: "rv"
  }, {
    string: navigator.userAgent,
    subString: "Mozilla",
    identity: "Netscape",
    versionSearch: "Mozilla"
  } ],
  dataOS: [ {
    string: navigator.platform,
    subString: "Win",
    identity: "Windows"
  }, {
    string: navigator.platform,
    subString: "Mac",
    identity: "Mac"
  }, {
    string: navigator.userAgent,
    subString: "iPhone",
    identity: "iPhone/iPod"
  }, {
    string: navigator.platform,
    subString: "Linux",
    identity: "Linux"
  } ]

};
BrowserDetect.init();

var isMobile = {
  Android: function () {
    return navigator.userAgent.match( /Android/i );
  },
  BlackBerry: function () {
    return navigator.userAgent.match( /BlackBerry/i );
  },
  iOS: function () {
    return navigator.userAgent.match( /iPhone|iPad|iPod/i );
  },
  Opera: function () {
    return navigator.userAgent.match( /Opera Mini/i );
  },
  Windows: function () {
    return navigator.userAgent.match( /IEMobile/i );
  },
  any: function () {
    return ( isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows() );
  }
};

if ( isMobile.any() ) {
  alert( 'Mobile browsers are not supported yet.' );
}

if ( BrowserDetect.browser != 'Chrome' &&
  BrowserDetect.browser != 'Firefox' ) {
  alert( 'Your browser might not be supported.' );
}

// CALLING SETUP FUNCTIONS

// Setting the size of the oscillator list.
for ( let i = 0; i < 25; i++ ) {
  oscList[ i ] = null;
}
// Computing the frequency of all notes.
createFreqList();

// Populating the list of known scales.
createScaleList();
// Select C scale.
changeScale( 0 );

// Populating the list of known sequences.
createSequenceList();
// No modes shown.
changeModeMechanic( 'None' );

// The compressor avoids buzzing when playing many notes.
compressorSetUp();

// Add buttons for tutorials and rooms.
updateRoomBox();

// Authentication is required for online features.
logIn();

// Load the files for sequence prediction.
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

// For mobile devices: listen to touch events on the keyboard, prevent the default action, see as mouse clicks.
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

// Clicking the chat box opens the chat overlay on the keyboard.
document.getElementById( 'chatBox' )
  .addEventListener( 'mousedown', toggleChatOverlay );

// Pressing enter with the chat overlay present sends the message.
document.getElementById( 'writeMessage' )
  .addEventListener( 'keyup',
    function ( event ) {
      event.preventDefault();
      if ( event.code == 'Enter' ) {
        sendMessage();
      }
    } );

// The entire window always listens to the keyboard.
window.addEventListener( 'keydown', ( event ) => {
  if ( chatOverlayIsVisible || event.repeat ) {
    return;
  }
  if ( !event.code.startsWith( 'F' ) && !( event.code == 'Escape' ) ) {
    if ( event.stopPropagation ) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
  handleLocalEvent( event.type, event.code, event.timeStamp );
} );

window.addEventListener( 'keyup', ( event ) => {
  if ( chatOverlayIsVisible ) {
    return;
  }
  if ( !event.code.startsWith( 'F' ) && !( event.code == 'Escape' ) ) {
    if ( event.stopPropagation ) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
  handleLocalEvent( event.type, event.code, event.timeStamp );
} );

// All keys listen for clicks (or touches, by proxy).
document.querySelectorAll( '.key' )
  .forEach( function ( key ) {
    if ( key.id == 'scaleSliderCursor' ) {
      return;
    }
    key.addEventListener( 'mousedown', ( event ) => {
      if ( chatOverlayIsVisible ) {
        return;
      } // This might be overkill: the overlay would be over the keys
      handleLocalEvent( 'keydown', key.dataset[ 'code' ], event.timeStamp );
    } );
    key.addEventListener( 'mouseup', ( event ) => {
      if ( chatOverlayIsVisible ) {
        return;
      } // This might be overkill: the overlay would be over the keys
      handleLocalEvent( 'keyup', key.dataset[ 'code' ], event.timeStamp );
    } );
    key.addEventListener( 'mouseleave', ( event ) => {
      if ( chatOverlayIsVisible ) {
        return;
      } // This might be overkill: the overlay would be over the keys
      handleLocalEvent( 'keyup', key.dataset[ 'code' ], event.timeStamp );
    } );
  } );

// This is called on every keydown or keyup event on the window (and mouse clicks).
// It decides between playing a note or performing another action.
// Can call handleNoteStart() and handleNoteStop(),
// changeMode(), nextTutorialStep(), or previousTutorialStep().
function handleLocalEvent( type, code, timestamp ) {
  if ( type == 'keydown' ) {
    switch ( true ) {
      case code == 'Space':
      case code.startsWith( 'Numpad' ):
        if ( iAmAdmin || ( !roomName && !inTutorial && !inUserUpload ) ) {
          changeMode( code );
        }
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
      case code == 'Backspace':
        break;
      default:
        handleNoteStop( code );
    }
  }

  let computedTimestamp = timestamp - previousLocalTimestamp;
  if ( !previousLocalTimestamp ) {
    computedTimestamp = 0
  }
  previousLocalTimestamp = timestamp;

  let keypress = {
    code: code,
    type: type,
    timestamp: computedTimestamp
  }

  if ( recordingNow ) {
    if ( recordedKeypressesCount >= 99999 ) {
      console.error( 'Too many keypresses!' );
      return;
    }
    recordedKeypresses[ ( recordedKeypressesCount++ )
      .toString()
      .padStart( 5, '0' ) ] = keypress;
  }

  if ( roomName && iAmAdmin ) {
    firebase.database()
      .ref( 'keypresses/' + roomName )
      .push( keypress )
      .catch( function ( error ) {
        console.error( 'Error updating keypress on Realtime Database:', error );
      } );
  }
}


// REMOTE EVENT LISTENERS

// When in a room (created by someone else), this is called for every keypress heard.
// If no other keypresses are being handled, the new one is; otherwise it's pushed to the queue.
// The first event of a series is reproduced with a delay, to ensure that the following events are heard in time.
// The following events are scheduled based on their delay in relation to the previous, which is part of the DB entry.
function listenForRemoteEvents( val, delay ) {
  let remoteEvent = val;
  remoteEvents.push( {
    type: remoteEvent.type,
    code: remoteEvent.code,
    timestamp: remoteEvent.timestamp
  } )
  if ( !scheduledEvent ) {
    scheduledEvent = setTimeout( handleNextRemoteEvent, delay );
  }
}

// This acts on heard keypresses from the room admin in the same way as handleLocalEvent(),
// and schedules the next queued keypress if present.
function handleNextRemoteEvent() {
  if ( remoteEvents[ 0 ].type == 'keydown' ) {
    switch ( true ) {
      case remoteEvents[ 0 ].code == 'Space':
      case remoteEvents[ 0 ].code.startsWith( 'Numpad' ):
        changeMode( remoteEvents[ 0 ].code );
        break;
      default:
        handleNoteStart( remoteEvents[ 0 ].code );
    }
  }
  if ( remoteEvents[ 0 ].type == 'keyup' ) {
    switch ( true ) {
      case remoteEvents[ 0 ].code == 'Space':
      case remoteEvents[ 0 ].code.startsWith( 'Numpad' ):
        break;
      default:
        handleNoteStop( remoteEvents[ 0 ].code );
    }
  }
  remoteEvents.shift();

  if ( remoteEvents[ 0 ] ) {
    scheduledEvent = setTimeout( handleNextRemoteEvent, remoteEvents[ 0 ].timestamp / playBackSpeed );
  } else {
    scheduledEvent = null;
  }
}

// If the connection drops, lock the online features box.
firebase.database()
  .ref( '.info/connected' )
  .on( 'value', function ( snap ) {
    if ( !snap.val() ) {
      document.getElementById( 'onlineOverlay' )
        .style.display = 'block';
      document.getElementById( 'onlineOverlayText' )
        .innerHTML = 'Waiting for server connection.';
      document.getElementById( 'onlineOverlayButton' )
        .style.display = 'none';
      document.getElementById( 'chatOverlay' )
        .style.display = 'none';
      chatOverlayIsVisible = false;

      if ( roomName && iAmAdmin ) {
        roomName = null;
        updateChatListener();
        updateRoomBox();
      } else {
        leaveRoom();
        exitTutorial();
      }
    } else {
      document.getElementById( 'onlineOverlay' )
        .style.display = 'none';
      if ( !userID ) {
        document.getElementById( 'onlineOverlay' )
          .style.display = 'block';
        document.getElementById( 'onlineOverlayText' )
          .innerHTML = 'Authentication failed.';
        document.getElementById( 'onlineOverlayButton' )
          .style.display = 'block';
      }
    }
  }, function ( error ) {
    console.error( "Couldn't determine connection.", error );
    document.getElementById( 'onlineOverlay' )
      .style.display = 'block';
    document.getElementById( 'onlineOverlayText' )
      .innerHTML = 'Waiting for server connection.';
    document.getElementById( 'onlineOverlayButton' )
      .style.display = 'none';
    document.getElementById( 'chatOverlay' )
      .style.display = 'none';
    chatOverlayIsVisible = false;

    if ( roomName && iAmAdmin ) {
      roomName = null;
      updateChatListener();
      updateRoomBox();
    } else {
      leaveRoom();
      exitTutorial();
    }
  } );

// If login fails, lock the online features box.
function logIn() {
  firebase.auth()
    .signInAnonymously()
    .catch( function ( error ) {
      console.error( "Couldn't sign in.", error );
    } );
  if ( !userID ) {
    document.getElementById( 'onlineOverlay' )
      .style.display = 'block';
    document.getElementById( 'onlineOverlayText' )
      .innerHTML = 'Authentication failed.';
    document.getElementById( 'onlineOverlayButton' )
      .style.display = 'block';
  } else {
    document.getElementById( 'onlineOverlay' )
      .style.display = 'none';
  }
}

// Upon authentication, set the userID var and retrieve displayName from DB.
firebase.auth()
  .onAuthStateChanged( function ( user ) {
    if ( user ) {
      userID = user.uid;

      firebase.database()
        .ref( 'users/' + userID + '/displayName' )
        .once( 'value' )
        .then( function ( snap ) {
          myDisplayName = snap.val();

          if ( myDisplayName ) {
            document.getElementById( 'displayNameText' )
              .innerHTML = 'You are ' + myDisplayName + '. Click here to change displayName.';
          } else {
            document.getElementById( 'displayNameText' )
              .innerHTML = 'You are anonymous. Click here to change displayName.';
          }
        }, function ( error ) {
          console.error( "Couldn't find displayName.", error );
          document.getElementById( 'displayNameText' )
            .innerHTML = 'You are anonymous. Click here to change displayName.';
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
  scaleList[ 1 ] = [ 'A', 'B', 'C#', 'D', 'E', 'F#', 'G#' ];
  scaleList[ 2 ] = [ 'A#', 'C', 'D', 'D#', 'F', 'G', 'A' ];
  scaleList[ 3 ] = [ 'B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#' ];
  scaleList[ 4 ] = [ 'C', 'D', 'E', 'F', 'G', 'A', 'B' ];
  scaleList[ 5 ] = [ 'C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C' ];
  scaleList[ 6 ] = [ 'D', 'E', 'F#', 'G', 'A', 'B', 'C#' ];
  scaleList[ 7 ] = [ 'D#', 'F', 'G', 'G#', 'A#', 'C', 'D' ];
  scaleList[ 8 ] = [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D#' ];
  scaleList[ 9 ] = [ 'F', 'G', 'A', 'A#', 'C', 'D', 'E' ];
  scaleList[ 10 ] = [ 'F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F' ];
  scaleList[ 11 ] = [ 'G', 'A', 'B', 'C', 'D', 'E', 'F#' ];
  scaleList[ 12 ] = [ 'G#', 'A#', 'C', 'C#', 'D#', 'F', 'G' ];
}

// Create a list of common sequences.
// N.B. since they're indexes, you have to -1 from every element of the sequence.
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

// The compressor avoids buzzing when playing many notes.
function compressorSetUp() {
  compressor.threshold.setValueAtTime( -10, audioContext.currentTime );
  compressor.knee.setValueAtTime( 10, audioContext.currentTime );
  compressor.ratio.setValueAtTime( 20, audioContext.currentTime );
  compressor.attack.setValueAtTime( 0, audioContext.currentTime );
  compressor.release.setValueAtTime( 0.1, audioContext.currentTime );
  compressor.connect( audioContext.destination );
}

// To load JSON files as JS objects.
function loadJSON( callback, filename ) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType( 'application/json' );
  xobj.open( 'GET', filename, true );
  xobj.onreadystatechange = function () {
    if ( xobj.readyState == 4 && xobj.status == '200' ) {
      callback( xobj.responseText );
    }
  }
  xobj.send( null );
}


// SYNTH MANAGEMENT FUNCTIONS

// Finds the key that was pressed, starts the appropriate synth, and
// changes the interface to show the pressed button.
// Always calls startTone().
function handleNoteStart( code ) {
  let button = document.querySelector( '[data-code="' + code + '"]' );

  if ( button == null ) {
    return;
  }

  startTone( button.dataset[ 'id' ] );

  button.classList.add( 'pressed' );
}

// Finds the key that was released, stops the corresponding synth, and resets the interface.
// Always calls stopTone().
function handleNoteStop( code ) {
  let button = document.querySelector( '[data-code="' + code + '"]' );

  if ( button == null ) {
    return;
  }

  stopTone( button.dataset[ 'id' ] );

  button.classList.remove( 'pressed' );
}

// Starts a new synth, setting the waveform and frequency.
function startTone( i ) {
  if ( oscList[ i ] !== null ) {
    return;
  }

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

// Finds the lowest root note and highest fifth note on the keyboard,
// all roots, thirds, and fifths between them,
// all keys corresponfing to those notes, and simulates pressing them.
// Always calls handleNoteStart() and handleNoteStop().
function playChord( mode ) {
  if ( mode > 6 ) {
    return;
  }

  let first = document.getElementsByClassName( numerals[ ( 0 + mode ) % 7 ] );
  let third = document.getElementsByClassName( numerals[ ( 2 + mode ) % 7 ] );
  let fifth = document.getElementsByClassName( numerals[ ( 4 + mode ) % 7 ] );
  let seventh = document.getElementsByClassName( numerals[ ( 6 + mode ) % 7 ] );

  let lowestNote = 99;
  let highestNote = -1;
  let keysToPlay = [];

  [].forEach.call( first, function ( f ) {
    if ( !f ||
      !f.parentNode.classList ||
      !f.parentNode.classList.contains( 'key' ) ||
      f.parentNode.id == 'scaleSliderCursor'
    ) {
      return;
    }

    // If the seventh is to be played, only one root note (the lowest)
    // is picked: extending the chord over more than one octave would sound bad.
    if ( playSeventhSelected &&
      lowestNote != 99 &&
      lowestNote < +f.parentNode.dataset[ 'id' ]
    ) {
      return;
    }

    keysToPlay.push( f.parentNode );

    if ( lowestNote > +f.parentNode.dataset[ 'id' ] ) {
      lowestNote = +f.parentNode.dataset[ 'id' ];
    }
  } );

  [].forEach.call( third, function ( t ) {
    if ( !t ||
      !t.parentNode.classList ||
      !t.parentNode.classList.contains( 'key' ) ||
      t.parentNode.id == 'scaleSliderCursor'
    ) {
      return;
    }

    keysToPlay.push( t.parentNode );
  } );

  [].forEach.call( fifth, function ( f ) {
    if ( !f ||
      !f.parentNode.classList ||
      !f.parentNode.classList.contains( 'key' ) ||
      f.parentNode.id == 'scaleSliderCursor'
    ) {
      return;
    }

    keysToPlay.push( f.parentNode );

    if ( !playSeventhSelected ) {
      if ( highestNote < +f.parentNode.dataset[ 'id' ] ) {
        highestNote = +f.parentNode.dataset[ 'id' ];
      }
    }
  } );

  if ( playSeventhSelected ) {
    [].forEach.call( seventh, function ( s ) {
      if ( !s ||
        !s.parentNode.classList ||
        !s.parentNode.classList.contains( 'key' ) ||
        s.parentNode.id == 'scaleSliderCursor'
      ) {
        return;
      }

      // If the seventh is to be played, only one seventh note (the lowest above the lowest root)
      // is picked: extending the chord over more than one octave would sound bad.
      if ( highestNote != -1 || s.parentNode.dataset[ 'id' ] <= lowestNote ) {
        return;
      }

      keysToPlay.push( s.parentNode );

      if ( highestNote < +s.parentNode.dataset[ 'id' ] ) {
        highestNote = +s.parentNode.dataset[ 'id' ];
      }
    } );
  }

  [].forEach.call( keysToPlay, function ( key ) {
    if ( key.dataset[ 'id' ] < lowestNote ||
      key.dataset[ 'id' ] > highestNote
    ) {
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


// INTERFACE FUNCTIONS

// Changes the scale.
// Always calls renderScale().
function changeScale( value ) {
  if ( isNaN( value ) ) {
    return;
  }
  value = +value;

  if ( value < 13 && value >= 0 ) {
    currentScale = scaleList[ value ];
  } else {
    return;
  }

  currentScaleIndex = value;

  resetChordProgression();

  renderScale();
}

// Changes the mode according to the selected mechanic and keypress.
// Always calls renderMode(), handleChordProgression().
function changeMode( code ) {
  if ( modeMechanic == 'None' || ( roomName && !iAmAdmin ) ) {
    return;
  }

  if ( code == 'Space' ) {
    currentModeIndex = ( currentModeIndex + 1 ) % selectedSequence.length;
  } else {
    let number = code.match( /\d+$/ );

    if ( number == null ) {
      return;
    }

    number = parseInt( number[ 0 ], 10 );
    if ( number > selectedSequence.length ) {
      return;
    }

    currentModeIndex = number - 1;
    if ( currentModeIndex == -1 ) {
      currentModeIndex = 0
    }
  }

  renderMode();
  handleChordProgression();
  if ( playChordSelected ) {
    playChord( selectedSequence[ currentModeIndex ] )
  }
}

// Changes the mode mechanic.
// Always calls renderSequence().
function changeModeMechanic( value ) {
  modeMechanic = value;
  currentModeIndex = -1;
  selectedSequenceIndex = 0;

  switch ( modeMechanic ) {
    case 'None':
      selectedSequence = [];
      break;
    case 'Free':
      selectedSequence = [ 0, 1, 2, 3, 4, 5, 6 ];
      break;
    case 'Progression':
      selectedSequence = sequenceList[ 0 ];
      break;
    default:
      return;
  }

  if ( modeMechanic != 'None' && currentScaleIndex == 0 ) {
    changeScale( 4 );
  }

  resetChordProgression();

  [].forEach.call( document.getElementById( 'mechanicSettingsBox' )
    .childNodes,
    function ( box ) {
      if ( box.name == 'mode' ) {
        box.checked = false;
        if ( box.value == value ) {
          box.checked = true;
        }
      }
    } );

  renderSequence();
}

// Clears the tags from all colored markers and assigns them again according to
// the selected scale.
// Always calls renderSlider(), renderMode().
function renderScale() {
  // Remove color classes.
  let divs = document.querySelectorAll( '.mode' );
  divs.forEach( function ( div ) {
    if ( !div.id.startsWith( 'mode' ) && !div.classList.contains( 'tensionLabel' ) && !div.classList.contains( 'nextTensionLabel' ) ) {
      numerals.forEach( function ( numeral ) {
        div.classList.remove( numeral );
      } );
      div.classList.add( 'outOfScale' );
    }
  } );

  renderSlider();

  [].forEach.call( document.getElementsByClassName( 'key' ), function ( key ) {
    for ( i = 0; i < currentScale.length; i++ ) {
      let keyNote = key.getElementsByClassName( 'ENGnote' )[ 0 ];
      if ( keyNote ) {
        keyNote = keyNote.innerHTML;
        keyNote = keyNote.replace( '<small>#</small>', '#' );
        if ( currentScale[ i ] == keyNote ) {
          key.getElementsByClassName( 'mode' )[ 0 ].classList.add( numerals[ i ] );
          key.getElementsByClassName( 'mode' )[ 0 ].classList.remove( 'outOfScale' );
        }
      }
    }
  } );

  renderMode();
}

// Displays the cursor for selecting the scale, in the right place.
function renderSlider() {
  let scaleSliderRange = document.getElementById( 'scaleSliderRange' );
  let scaleSliderLabel = document.getElementById( 'scaleSliderLabel' );
  let scaleSliderLabelInfo = document.getElementById( 'scaleSliderLabelInfo' );
  let scaleSliderCursor = document.getElementById( 'scaleSliderCursor' );
  let scaleSliderCursorMode = document.getElementById( 'scaleSliderCursorMode' );
  let dashedPointer = document.getElementById( 'dashedPointer' );

  scaleSliderRange.value = currentScaleIndex;

  scaleSliderCursorMode.classList.add( 'I' );
  scaleSliderCursorMode.classList.remove( 'outOfScale' );

  if ( currentScaleIndex % 2 ) {
    dashedPointer.style.height = 63 + 'px';
    dashedPointer.style.transform = '';
  } else {
    dashedPointer.style.height = 122 + 'px';
    dashedPointer.style.transform = 'rotate(0.005rad) translate(-1px)';
  }

  if ( currentScaleIndex ) {
    scaleSliderLabel.innerHTML = 'Scale: ' + currentScale[ 0 ] + ' Major.';
    scaleSliderLabelInfo.innerHTML = currentScale[ 0 ] + ' is the tonic (in green),' +
      '<br>the note from which the scale is built.';
  } else {
    dashedPointer.style.height = 0 + 'px';
    scaleSliderLabel.innerHTML = 'No scale selected.';
    scaleSliderLabelInfo.innerHTML = 'Drag this button to select the<br>' +
      'tonic of the scale to display.';
  }

  let pad = +window.getComputedStyle( document.getElementById( 'scaleBox' ) )
    .getPropertyValue( 'margin-left' )
    .match( /\d+/ )[ 0 ];

  dashedPointer.style.left = ( pad + 3 + ( scaleSliderRange.value / scaleSliderRange.max ) * 375 ) + 'px';
  scaleSliderCursor.style.left = ( pad + ( scaleSliderRange.value / scaleSliderRange.max ) * 375 ) + 'px';
  scaleSliderLabel.style.left = ( pad + 75 + ( scaleSliderRange.value / scaleSliderRange.max ) * 375 ) + 'px';
  scaleSliderLabelInfo.style.left = ( pad + 75 + ( scaleSliderRange.value / scaleSliderRange.max ) * 375 ) + 'px';
}
// Clears the highlights from all colored markers and assigns them again
// according to the selected mode.
// Always calls broadcastSettings().
function renderMode() {

  // (broadcastSettings is called here simply because this is called after any
  // setting change worth broadcasting)
  broadcastSettings();

  [].forEach.call( document.getElementsByClassName( 'mode' ), function ( modeLabel ) {
    modeLabel.classList.remove( 'rootNote', 'fifthNote', 'colorNote', 'tensionNote' );
  } );

  if ( currentModeIndex < 0 ) {
    return;
  }

  // Unselect every second, fourth, sixth, and seventh,
  let root = numerals[ selectedSequence[ currentModeIndex ] ];
  let second = numerals[ ( 1 + selectedSequence[ currentModeIndex ] ) % 7 ];
  let third = numerals[ ( 2 + selectedSequence[ currentModeIndex ] ) % 7 ];
  let fourth = numerals[ ( 3 + selectedSequence[ currentModeIndex ] ) % 7 ];
  let fifth = numerals[ ( 4 + selectedSequence[ currentModeIndex ] ) % 7 ];
  let sixth = numerals[ ( 5 + selectedSequence[ currentModeIndex ] ) % 7 ];
  let seventh = numerals[ ( 6 + selectedSequence[ currentModeIndex ] ) % 7 ];

  [].forEach.call( document.getElementsByClassName( root ), function ( rootNote ) {
    if ( rootNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !rootNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !rootNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      rootNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'rootNote' );
    }
  } );

  [].forEach.call( document.getElementsByClassName( second ), function ( secondNote ) {
    if ( secondNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !secondNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !secondNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      secondNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'tensionNote' );
    }
  } );

  [].forEach.call( document.getElementsByClassName( third ), function ( thirdNote ) {
    if ( thirdNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !thirdNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !thirdNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      thirdNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'colorNote' );
    }
  } );

  [].forEach.call( document.getElementsByClassName( fourth ), function ( fourthNote ) {
    if ( fourthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !fourthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !fourthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      fourthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'tensionNote' );
    }
  } );

  [].forEach.call( document.getElementsByClassName( fifth ), function ( fifthNote ) {
    if ( fifthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !fifthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !fifthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      fifthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'fifthNote' );
    }
  } );

  [].forEach.call( document.getElementsByClassName( sixth ), function ( sixthNote ) {
    if ( sixthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !sixthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !sixthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      sixthNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'tensionNote' );
    }
  } );

  [].forEach.call( document.getElementsByClassName( seventh ), function ( seventhNote ) {
    if ( seventhNote.parentNode.getElementsByClassName( 'mode' )[ 0 ] &&
      !seventhNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'tensionLabel' ) &&
      !seventhNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.contains( 'nextTensionLabel' ) ) {
      seventhNote.parentNode.getElementsByClassName( 'mode' )[ 0 ].classList.add( 'colorNote' );
    }
  } );

  // Reset all markers IN THE MODEBOX to unselected,
  divs = document.querySelectorAll( '[id^="mode"]' );
  divs.forEach( function ( div ) {
    if ( div.id.startsWith( 'mode' ) ) {
      div.classList.remove( 'rootNote', 'fifthNote', 'colorNote', 'tensionNote' );
      div.classList.add( 'unselected' );
    }
  } );

  // Select the cursor IN THE MODEBOX.
  let cursor = document.getElementById( 'mode' + currentModeIndex );
  if ( cursor != null ) {
    cursor.classList.remove( 'unselected' );
  }
}

// Change the sequence according to the selected mechanic.
// Always calls renderMode().
function renderSequence() {
  // Empty the sequence box.
  let box = document.getElementById( 'sequenceBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }

  if ( modeMechanic == 'Progression' ) {
    let div = document.createElement( 'div' );
    div.classList.add( 'leftArrow', 'FLATgray' );
    div.addEventListener( 'click', ( event ) => {
      selectedSequenceIndex = selectedSequenceIndex - 1;
      if ( selectedSequenceIndex < 0 ) {
        selectedSequenceIndex = sequenceList.length - 1
      }
      currentModeIndex = -1;

      selectedSequence = sequenceList[ selectedSequenceIndex ];

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

    arrowFillC.classList.add( 'percentageFill', 'FLATgray', 'consonance' );
    arrowOutlineC.classList.add( 'percentageOutline' );
    arrowFillE.classList.add( 'percentageFill', 'FLATgray', 'expectation' );
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

  if ( modeMechanic == 'Progression' ) {
    let div = document.createElement( 'div' );
    div.classList.add( 'rightArrow', 'FLATgray' );
    div.addEventListener( 'click', ( event ) => {
      selectedSequenceIndex = ( selectedSequenceIndex + 1 ) % sequenceList.length;
      currentModeIndex = -1;

      selectedSequence = sequenceList[ selectedSequenceIndex ];

      renderSequence();
      handleChordProgression();
    } );
    box.appendChild( div );
  }

  renderMode();
}

// Show the full chat blocking the keyboard, or don't.
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
    if ( inTutorial || inUserUpload ) {
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

// Toggle the labels for eng/ita note names.
function showNoteLabels( value, checked ) {
  switch ( value ) {
    case 'eng':
      engNotesShown = checked;
      break;
    case 'ita':
      itaNotesShown = checked;
      break;
  }

  let labels = document.getElementsByClassName( 'label' );
  [].forEach.call( labels, function ( label ) {
    if ( label.classList.contains( 'ENGnote' ) ) {
      label.style.display = ( engNotesShown ) ? 'block' : 'none'
    }
    if ( label.classList.contains( 'ITAnote' ) ) {
      label.style.display = ( itaNotesShown ) ? 'block' : 'none'
    }
  } );
}



// TENSION FUNCTIONS

// Update the tension wave visualization.
function changeTension( id, intensity ) {
  let svg = document.getElementById( id );
  let waveBack = document.getElementById( id + 'Back' );
  let waveFront = document.getElementById( id + 'Front' );

  svg.classList.remove( 'I', 'III', 'IV', 'V' );
  switch ( intensity ) {
    case -1:
      svg.classList.add( 'FLATgray' );
      intensity = 0;
      break;
    case 0:
      svg.classList.add( 'I' );
      break;
    case 1:
      svg.classList.add( 'III' );
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

// A new chord has been played: push it on the queue, compute the tension,
// get the predicitons for consonance and expectation.
// Always calls changeTension().
function handleChordProgression() {
  if ( currentModeIndex < 0 ) {
    resetChordProgression();
    return;
  }
  if ( !playedSequence ) {
    resetChordProgression();
  }
  if ( playedSequence[ playedSequence.length - 1 ] == numerals[ selectedSequence[ currentModeIndex ] ] ) {
    return;
  }

  playedSequence.push( numerals[ selectedSequence[ currentModeIndex ] ] );
  while ( playedSequence.length > maxSequenceMemory ) {
    playedSequence.shift();
  }

  // expectation
  let expectation = null;
  if ( expectationPrediction ) {
    expectation = expectationPrediction[ playedSequence[ playedSequence.length - 1 ] ];
  }
  // consonance
  let consonance = null;
  if ( consonancePrediction ) {
    consonance = consonancePrediction[ numerals[ selectedSequence[ currentModeIndex ] ] ];
  }

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
  changeTension( 'currentTension', tension );
  changeTension( 'pastTension', previousTension );

  switch ( tension ) {
    case -1:
      document.getElementById( 'tensionAdvice' )
        .innerHTML = 'It is best to start<br>with the tonic.';
      break;

    case 0:
      document.getElementById( 'tensionAdvice' )
        .innerHTML = 'You played the tonic:<br>no tension is felt.';
      break;

    case 5:
      document.getElementById( 'tensionAdvice' )
        .innerHTML = 'Resolve the tension!';
      break;

    default:
      document.getElementById( 'tensionAdvice' )
        .innerHTML = '';
  }

  numerals.forEach( function ( numeral ) {
    document.getElementById( 'currentChord' )
      .classList.remove( numeral );
    document.getElementById( 'pastChord' )
      .classList.remove( numeral );
    document.getElementById( 'pastPastChord' )
      .classList.remove( numeral );
  } );

  document.getElementById( 'currentChord' )
    .classList.remove( 'FLATgray' );
  document.getElementById( 'currentChord' )
    .classList.add( playedSequence[ playedSequence.length - 1 ] );
  document.getElementById( 'currentChord' )
    .innerHTML = playedSequence[ playedSequence.length - 1 ];

  if ( playedSequence.length > 1 ) {
    document.getElementById( 'pastChord' )
      .classList.remove( 'FLATgray' );
    document.getElementById( 'pastChord' )
      .classList.add( playedSequence[ playedSequence.length - 2 ] );
    document.getElementById( 'pastChord' )
      .innerHTML = playedSequence[ playedSequence.length - 2 ];
  }

  if ( playedSequence.length > 2 ) {
    document.getElementById( 'pastPastChord' )
      .classList.remove( 'FLATgray' );
    document.getElementById( 'pastPastChord' )
      .classList.add( playedSequence[ playedSequence.length - 3 ] );
    document.getElementById( 'pastPastChord' )
      .innerHTML = playedSequence[ playedSequence.length - 3 ];
  }

  document.getElementById( 'pastFeeling' )
    .innerHTML = document.getElementById( 'currentFeeling' )
    .innerHTML;

  switch ( true ) {
    case ( tension == 0 && previousTension == 5 ):
      document.getElementById( 'currentFeeling' )
        .innerHTML = 'Resolution!';
      break;
    case ( tension == 1 && previousTension == 5 ):
      document.getElementById( 'currentFeeling' )
        .innerHTML = 'Deceit!';
      break;
    case ( consonancePrediction[ playedSequence[ playedSequence.length - 1 ] ] < 5 ):
      document.getElementById( 'currentFeeling' )
        .innerHTML = 'Weird leap...';
      break;
    default:
      document.getElementById( 'currentFeeling' )
        .innerHTML = '';
  }

  previousTension = tension;

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

  let consonanceDegree = 1;
  numerals.forEach( function ( numeral ) {
    switch ( true ) {
      case consonancePrediction[ numeral ] == 0:
        consonanceDegree = 0.5;
        break;
      case consonancePrediction[ numeral ] < 5:
        consonanceDegree = 0.7;
        break;
      case consonancePrediction[ numeral ] < 10:
        consonanceDegree = 0.8;
        break;
      case consonancePrediction[ numeral ] < 15:
        consonanceDegree = 0.9;
        break;
      default:
        consonanceDegree = 1;
        break;
    }

    document.getElementById( 'nextTensionLabel' + numeral )
      .style.opacity = consonanceDegree;
    document.getElementById( 'nextTensionLabel' + numeral )
      .style.transform = 'scale(' + consonanceDegree + ')';
  } );
}

// Get the next chord predictions by looking at the sequence in memory.
// If too many prediction probabilities are null, try again w/ shorter memory.
// Can call iteratively getNextChord().
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
    }
  } );

  return probabilities;
}

// Reset all variables related to handling tension and expectation.
function resetChordProgression() {
  previousTension = -1;
  playedSequence = [];
  consonancePrediction = [];
  expectationPrediction = [];
  changeTension( 'pastTension', -1 );
  changeTension( 'currentTension', -1 );

  numerals.forEach( function ( numeral ) {
    document.getElementById( 'currentChord' )
      .classList.remove( numeral );
    document.getElementById( 'pastChord' )
      .classList.remove( numeral );
    document.getElementById( 'pastPastChord' )
      .classList.remove( numeral );
  } );
  document.getElementById( 'currentChord' )
    .classList.add( 'FLATgray' );
  document.getElementById( 'pastChord' )
    .classList.add( 'FLATgray' );
  document.getElementById( 'pastPastChord' )
    .classList.add( 'FLATgray' );

  document.getElementById( 'currentChord' )
    .innerHTML = '';
  document.getElementById( 'pastChord' )
    .innerHTML = '';
  document.getElementById( 'pastPastChord' )
    .innerHTML = '';

  document.getElementById( 'tensionAdvice' )
    .innerHTML = 'It is best to start<br>with the tonic.';
  document.getElementById( 'nextTensionLabelI' )
    .style.opacity = 1;
  document.getElementById( 'nextTensionLabelI' )
    .style.transform = 'scale(1)';

  numerals.forEach( function ( numeral ) {
    if ( numeral != 'I' ) {
      document.getElementById( 'nextTensionLabel' + numeral )
        .style.opacity = 0.5;
      document.getElementById( 'nextTensionLabel' + numeral )
        .style.transform = 'scale(0.5)';
    }
  } );

  document.getElementById( 'pastFeeling' )
    .innerHTML = '';
  document.getElementById( 'currentFeeling' )
    .innerHTML = '';
}

// Display an animation next to the tension wave. It fades out.
// Has to be replaced every time, as CSS animations don't repeat.
/*
function alertFeeling( feeling, intensity ) {
  let svg = document.getElementById( 'feelingSVG' );
  let wave = document.getElementById( 'feeling' );

  wave.style.display = 'block';

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
  wave = document.getElementById( 'feeling' );

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
    wave.style.display = 'none';
  }, 2000 );
}
*/


// CHAT FUNCTIONS

// Empty the chat box and overlay and listen to messages from a room / none.
function updateChatListener() {
  let box = document.getElementById( 'chatBoxMessages' );
  let overlay = document.getElementById( 'chatOverlayMessages' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }
  while ( overlay.firstChild ) {
    overlay.removeChild( overlay.firstChild );
  }

  if ( !roomName && !inTutorial ) {
    document.getElementById( 'chatBox' )
      .style.display = 'none';
    document.getElementById( 'chatOverlay' )
      .style.display = 'none';
    return;
  }

  document.getElementById( 'chatBox' )
    .style.display = 'block';

  if ( !roomName ) {
    return;
  }

  firebase.database()
    .ref( 'messages/' + roomName )
    .off( 'child_added' );

  firebase.database()
    .ref( 'messages/' + roomName )
    .off( 'child_changed' );

  firebase.database()
    .ref( 'messages/' + roomName )
    .on( 'child_added', function ( snap ) {

      let message = document.createElement( 'div' );
      message.classList.add( 'message' );

      if ( snap.val()
        .admin ) {
        message.classList.add( 'VII' );
      } else {
        message.classList.add( 'FLATwhite' );
      }

      if ( snap.val()
        .displayName ) {
        message.appendChild( document.createTextNode( snap.val()
          .displayName + ' : ' + snap.val()
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

      if ( snap.val()
        .user != userID ) {
        giveSnack( 'New message in the chat!', 'VII' );
      }
    } );

  firebase.database()
    .ref( 'messages/' + roomName )
    .on( 'child_changed', function ( snap ) {

      let boxMessage = document.getElementById( 'box' + snap.key );
      let overlayMessage = document.getElementById( 'overlay' + snap.key );

      boxMessage.removeChild( boxMessage.firstChild );
      overlayMessage.removeChild( overlayMessage.firstChild );

      if ( snap.val()
        .displayName ) {
        boxMessage.appendChild( document.createTextNode( snap.val()
          .displayName + ' : ' + snap.val()
          .text ) );
        overlayMessage.appendChild( document.createTextNode( snap.val()
          .displayName + ' : ' + snap.val()
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

    } );
}

// Push a message to the current room.
function sendMessage() {
  if ( !roomName || !userID || !document.getElementById( 'writeMessage' )
    .value ) {
    return;
  }

  let message = {
    user: userID,
    displayName: myDisplayName,
    admin: iAmAdmin,
    text: document.getElementById( 'writeMessage' )
      .value
  }

  firebase.database()
    .ref( 'messages/' + roomName )
    .push( message )
    .catch( function ( error ) {
      console.error( "Couldn't send message.", error );
      return;
    } );

  document.getElementById( 'writeMessage' )
    .value = '';
}

// Scroll to the bottom of the chat box and overlay
// (needed to keep showing only the latest messages in the box).
function updateChatScroll() {
  let element = document.getElementById( 'chatBox' );
  element.scrollTop = element.scrollHeight;
  element = document.getElementById( 'chatOverlayMessages' );
  element.scrollTop = element.scrollHeight;
}

// Update all messages sent with the chosen displayName.
function changeDisplayName() {
  myDisplayName = prompt( 'Enter your new displayName.' );

  firebase.database()
    .ref( 'users/' + userID )
    .update( {
      displayName: myDisplayName
    } )
    .catch( function ( error ) {
      console.error( "Couldn't update displayName.", error );
    } )

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
                  displayName: myDisplayName
                } )
                .then( function () {

                  updateChatListener();

                }, function ( error ) {
                  console.error( "Couldn't update displayName.", error );
                } );
            } );
          }, function ( error ) {
            console.error( "Couldn't update displayName.", error );
          } );
      } );
    }, function ( error ) {
      console.error( "Couldn't update displayName.", error );
    } );

  if ( myDisplayName ) {
    document.getElementById( 'displayNameText' )
      .innerHTML = 'You are ' + myDisplayName + '. Click here to change displayName.';
  } else {
    document.getElementById( 'displayNameText' )
      .innerHTML = 'You are anonymous. Click here to change displayName.';
  }
}

// Show a notification.
function giveSnack( text, color ) {
  let snack = document.getElementById( 'snackbar' );
  snack.innerHTML = text;
  snack.classList.add( 'show' );
  snack.classList.add( color );
  setTimeout( function () {
    snack.classList.remove( 'show' );
    snack.classList.remove( color );
  }, 2000 );
}

// Disable or enable mode mechanic checkboxes and scale slider.
function disableSettings( bool ) {
  [].forEach.call( document.getElementById( 'mechanicSettingsBox' )
    .childNodes,
    function ( box ) {
      if ( box.name == 'mode' ) {
        box.disabled = bool;
      }
    } );
  document.getElementById( 'scaleSliderRange' )
    .disabled = bool;
}

// Show an overlay on the onlineBox that slowly fades out.
function fadeOutOverlay( text ) {
  let overlay = document.getElementById( 'onlineOverlay' );

  overlay.style.display = 'block';
  document.getElementById( 'onlineOverlayText' )
    .innerHTML = text;
  document.getElementById( 'onlineOverlayButton' )
    .style.display = 'none';

  overlay.style.animation = 'fade 5s cubic-bezier(0.75, 0.25, 0.75, 0.25) forwards';

  overlay.parentNode.replaceChild( overlay.cloneNode( true ), overlay );

  window.setTimeout( function () {
    document.getElementById( 'onlineOverlay' )
      .style.display = 'none';
    document.getElementById( 'onlineOverlay' )
      .style.animation = '';
  }, 5000 );
}


// ROOM FUNCTIONS

// Create a new room, of which you are admin.
// First, an entry is made in the /rooms DB branch with the local user as owner.
// On failure, nothing happens.
// On success,
// Entries are made for messages and settings,
// and the local user's branch is updated with the room.
// On any failure, all operations are rolled back, if possible.
// On success,
// room deletion is scheduled if the local user disconnects.
// On any failure, all operations are rolled back, if possible.
// On success, iAmAdmin is set to true and the online features box is updated.
function createRoom() {

  if ( roomName || !userID ) {
    return;
  }

  roomName = prompt( 'Enter the room name' );
  if ( !roomName ) {
    return;
  }

  firebase.database()
    .ref( 'rooms/' + roomName + '/owner' )
    .set( userID )
    .then( function () {

        let promises = [];

        promises.push(
          firebase.database()
          .ref( 'messages/' + roomName )
          .push( {
            admin: true,
            displayName: myDisplayName,
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
            sequence: selectedSequenceIndex
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

                  if ( !document.getElementById( 'onlineDetails' )
                    .open ) {
                    document.getElementById( 'onlineBanner' )
                      .click();
                  }

                  let box = document.getElementById( 'roomsBox' );
                  while ( box.firstChild ) {
                    box.removeChild( box.firstChild );
                  }

                  let leaveButton = document.createElement( 'button' );
                  leaveButton.appendChild( document.createTextNode( 'Leave room' ) );
                  leaveButton.addEventListener( 'click', ( event ) => {
                    leaveRoom()
                  } );
                  leaveButton.classList.add( 'V' );

                  box.appendChild( document.createTextNode( 'You are admin of room: ' + roomName ) );
                  box.appendChild( document.createElement( 'br' ) );
                  box.appendChild( leaveButton );

                  if ( myDisplayName ) {
                    document.getElementById( 'displayNameText' )
                      .innerHTML = 'You are ' + myDisplayName + '. Click here to change displayName.';
                  } else {
                    document.getElementById( 'displayNameText' )
                      .innerHTML = 'You are Admin. Click here to change displayName.';
                  }

                  iAmAdmin = true;

                  resetChordProgression();

                  updateChatListener();
                }, function ( error ) {
                  console.error( "Couldn't create room.", error );

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
                        console.error( "Couldn't rollback...", error );
                      } );

                  document.getElementById( 'onlineOverlay' )
                    .style.display = 'block';
                  document.getElementById( 'onlineOverlayText' )
                    .innerHTML = "Couldn't create room.<br>Please reload the page.";
                  document.getElementById( 'onlineOverlayButton' )
                    .style.display = 'none';
                } );
            },
            function ( error ) {
              console.error( "Couldn't create room.", error );

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
                    console.error( "Couldn't rollback...", error );
                  } );

              document.getElementById( 'onlineOverlay' )
                .style.display = 'block';
              document.getElementById( 'onlineOverlayText' )
                .innerHTML = "Couldn't create room.<br>Please reload the page.";
              document.getElementById( 'onlineOverlayButton' )
                .style.display = 'none';
            } );
      },
      function ( error ) {
        console.error( "Couldn't create room.", error );

        document.getElementById( 'onlineOverlay' )
          .style.display = 'block';
        document.getElementById( 'onlineOverlayText' )
          .innerHTML = "Couldn't create room.<br>Please reload the page.";
        document.getElementById( 'onlineOverlayButton' )
          .style.display = 'none';
      } );
}

// Join an existing room as spectator.
// The local user's branch is updated with the room.
// The online features box is updated.
// Start listening to admin's keypresses, ignoring past ones.
// Start listening to admin's settings and comply.
// Listen to the room's presence in the list and leave if it is removed.
function joinRoom( name ) {

  if ( roomName || !name || !userID ) {
    return;
  }

  roomName = name;

  if ( !document.getElementById( 'onlineDetails' )
    .open ) {
    document.getElementById( 'onlineBanner' )
      .click();
  }

  let box = document.getElementById( 'roomsBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }

  let leaveButton = document.createElement( 'button' );
  leaveButton.appendChild( document.createTextNode( 'Leave room' ) );
  leaveButton.addEventListener( 'click', ( event ) => {
    leaveRoom()
  } );
  leaveButton.classList.add( 'V' );

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
        listenForRemoteEvents( snap.val(), remoteEventDelay );
      } );

  updateChatListener();

  disableSettings( true );

  firebase.database()
    .ref( 'settings/' + roomName )
    .on( 'child_added',
      function ( snap ) {
        handleRemoteSettings( snap.val() );
      } );

  firebase.database()
    .ref( 'rooms/' + roomName )
    .on( 'child_removed',
      function ( snap ) {

        leaveRoom();

        fadeOutOverlay( 'You were kicked from the room.<br>(admin disconnected)' );
      } );
}

// Leave the current room.
// If spectating, stop listening to any branches related to the room;
// only afterwards update the graphic interface.
// If leaving the room as admin, confirmation is required;
// all branches are removed except for the rooms/ branch:
// that one is used by the DB to check that the removal requests come from admin.
// After removing all branches, on success,
// remove the /rooms branch and update the graphic interface.
function leaveRoom() {

  if ( !roomName ) {
    return;
  }

  if ( iAmAdmin ) {

    if ( !confirm( 'You are the room admin. Leaving will delete the room.' ) ) {
      return;
    }

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

    Promise.all( promises )
      .then( function () {

        firebase.database()
          .ref( 'rooms/' + roomName )
          .remove()
          .catch( function ( error ) {
            console.error( "Couldn't delete room.", error );

            document.getElementById( 'onlineOverlay' )
              .style.display = 'block';
            document.getElementById( 'onlineOverlayText' )
              .innerHTML = "Couldn't delete room.<br>Please reload the page.";
            document.getElementById( 'onlineOverlayButton' )
              .style.display = 'none';
          } );

        roomName = null;

        iAmAdmin = false;

        resetChordProgression();

        updateChatListener();

        updateRoomBox();

      }, function ( error ) {
        console.error( "Couldn't delete room.", error );

        document.getElementById( 'onlineOverlay' )
          .style.display = 'block';
        document.getElementById( 'onlineOverlayText' )
          .innerHTML = "Couldn't delete room.<br>Please reload the page.";
        document.getElementById( 'onlineOverlayButton' )
          .style.display = 'none';
      } );
  } else {

    remoteEvents = [];
    clearTimeout( scheduledEvent );
    scheduledEvent = null;
    document.querySelectorAll( '.key' )
      .forEach( function ( key ) {
        handleNoteStop( key.dataset[ 'code' ] );
      } );

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

    Promise.all( promises )
      .then( function () {

        roomName = null;

        resetChordProgression();

        updateChatListener();

        updateRoomBox();

      }, function ( error ) {
        console.error( "Couldn't leave room.", error );

        document.getElementById( 'onlineOverlay' )
          .style.display = 'block';
        document.getElementById( 'onlineOverlayText' )
          .innerHTML = "Couldn't leave room.<br>Please reload the page.";
        document.getElementById( 'onlineOverlayButton' )
          .style.display = 'none';
      } );
  }
}


// TUTORIAL FUNCTIONS

// Retrieve the data for one tutorial (in bunch) and store it in variables.
// Update the graphic interface and start the first tutorial step.
function loadTutorial( name ) {

  if ( roomName || !name || inTutorial || inUserUpload ) {
    return;
  }

  window.scrollTo( 0, 0 );

  playBackSpeed = 1;

  firebase.database()
    .ref( 'tutorials/data/' + name )
    .once( 'value' )
    .then( function ( snap ) {

      tutorialStepsCount = snap.val()
        .steps;

      disableSettings( true );

      handleRemoteSettings( snap.child( 'settings' )
        .val() );

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

      let box = document.getElementById( 'roomsBox' );
      while ( box.firstChild ) {
        box.removeChild( box.firstChild );
      }

      let playBackSpeedDiv = document.createElement( 'div' );
      let playBackSpeedText = document.createElement( 'h1' );
      let playBackSpeedSlider = document.createElement( 'input' );

      playBackSpeedDiv.id = 'playBackSpeedDiv';

      playBackSpeedText.id = 'playBackSpeedText';
      playBackSpeedText.appendChild( document.createTextNode( 'Playback speed: 1.0x' ) );

      playBackSpeedSlider.id = 'playBackSpeedSlider';
      playBackSpeedSlider.type = 'range';
      playBackSpeedSlider.value = 10;
      playBackSpeedSlider.min = 1;
      playBackSpeedSlider.max = 20;
      playBackSpeedSlider.addEventListener( 'mousemove', function () {
        playBackSpeed = 0.1 * document.getElementById( 'playBackSpeedSlider' )
          .value;
        document.getElementById( 'playBackSpeedText' )
          .innerHTML = 'Playback speed: ' + playBackSpeed.toFixed( 1 ) + 'x';
      } );

      playBackSpeedDiv.appendChild( playBackSpeedText );
      playBackSpeedDiv.appendChild( playBackSpeedSlider );
      box.appendChild( playBackSpeedDiv );

      let leaveButton = document.createElement( 'button' );
      leaveButton.appendChild( document.createTextNode( 'Exit tutorial' ) );
      leaveButton.addEventListener( 'click', ( event ) => {
        exitTutorial();
      } );
      leaveButton.classList.add( 'V' );
      box.appendChild( leaveButton );

      let nextButton = document.createElement( 'button' );
      let hoverLabelAbove = document.createElement( 'span' );

      hoverLabelAbove.appendChild( document.createTextNode( 'No further\nsteps.' ) );
      hoverLabelAbove.classList.add( 'hoverLabelAbove', 'FLATblack' );

      nextButton.id = 'nextTutorialStepButton';
      nextButton.appendChild( document.createTextNode( 'Next step' ) );
      nextButton.addEventListener( 'click', ( event ) => {
        nextTutorialStep();
      } );
      nextButton.classList.add( 'I' );

      nextButton.appendChild( hoverLabelAbove );
      box.appendChild( nextButton );

      let repeatButton = document.createElement( 'button' );
      repeatButton.id = 'repeatTutorialStepButton';
      repeatButton.appendChild( document.createTextNode( 'Repeat step' ) );
      repeatButton.addEventListener( 'click', ( event ) => {
        repeatTutorialStep();
      } );
      repeatButton.classList.add( 'II' );
      box.appendChild( repeatButton );

      let previousButton = document.createElement( 'button' );
      hoverLabelAbove = document.createElement( 'span' );

      hoverLabelAbove.appendChild( document.createTextNode( 'No previous\nsteps.' ) );
      hoverLabelAbove.classList.add( 'hoverLabelAbove', 'FLATblack' );

      previousButton.id = 'previousTutorialStepButton';
      previousButton.disabled = true;
      previousButton.appendChild( document.createTextNode( 'Previous step' ) );
      previousButton.addEventListener( 'click', ( event ) => {
        previousTutorialStep();
      } );
      previousButton.classList.add( 'III' );

      previousButton.appendChild( hoverLabelAbove );
      box.appendChild( previousButton );

      inTutorial = true;

      updateChatListener();

      tutorialStep = -1;
      nextTutorialStep();
    }, function ( error ) {
      console.error( "Couldn't load tutorial.", error );

      fadeOutOverlay( "Couldn't load tutorial.<br>Try again later or reload the page." );
    } );
}

// Stop the current tutorial, any scheduled keypresses, and current notes.
// Always calls updateRoomBox(), updateChatListener().
function exitTutorial() {
  if ( roomName || ( !inTutorial && !inUserUpload ) ) {
    return;
  }

  remoteEvents = [];
  clearTimeout( scheduledEvent );
  scheduledEvent = null;
  document.querySelectorAll( '.key' )
    .forEach( function ( key ) {
      handleNoteStop( key.dataset[ 'code' ] );
    } );

  inTutorial = false;
  inUserUpload = false;
  updateRoomBox();
  updateChatListener();
}

// Skip to the next tutorial step, stopping any scheduled keypresses and current notes.
function nextTutorialStep() {
  if ( !inTutorial || tutorialStep >= tutorialStepsCount - 1 ) {
    console.log( 'Not allowed' );
    return;
  }
  tutorialStep++;

  if ( tutorialStep >= tutorialStepsCount - 1 ) {
    document.getElementById( 'nextTutorialStepButton' )
      .disabled = true;
  } else {
    document.getElementById( 'nextTutorialStepButton' )
      .disabled = false;
  }
  if ( !tutorialStep ) {
    document.getElementById( 'previousTutorialStepButton' )
      .disabled = true;
  } else {
    document.getElementById( 'previousTutorialStepButton' )
      .disabled = false;
  }

  if ( tutorialMessages[ tutorialStep ] ) {
    let box = document.getElementById( 'chatBoxMessages' );
    let overlay = document.getElementById( 'chatOverlayMessages' );

    let message = document.createElement( 'div' );
    message.classList.add( 'message', 'VII' );

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
      listenForRemoteEvents( keypressSnap.val(), 0 );
    } );
  }
}

// Restart the tutorial step, stopping any scheduled keypresses and current notes.
function repeatTutorialStep() {
  if ( !inTutorial ) {
    return;
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
      listenForRemoteEvents( keypressSnap.val(), 0 );
    } );
  }
}

// Go back to the previous tutorial step, stopping any scheduled keypresses and current notes.
function previousTutorialStep() {
  if ( !tutorialStep || !inTutorial ) {
    console.log( 'Not allowed' );
    return;
  }
  tutorialStep--;

  if ( tutorialStep >= tutorialStepsCount - 1 ) {
    document.getElementById( 'nextTutorialStepButton' )
      .disabled = true;
  } else {
    document.getElementById( 'nextTutorialStepButton' )
      .disabled = false;
  }
  if ( !tutorialStep ) {
    document.getElementById( 'previousTutorialStepButton' )
      .disabled = true;
  } else {
    document.getElementById( 'previousTutorialStepButton' )
      .disabled = false;
  }

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
      listenForRemoteEvents( keypressSnap.val(), 0 );
    } );
  }
}


// ROOM/TUTORIAL FUNCTIONS

// Build the buttons for all tutorials and rooms.
function updateRoomBox() {
  firebase.database()
    .ref( 'rooms' )
    .off( 'child_added' );
  firebase.database()
    .ref( 'uploads/names' )
    .off( 'child_added' );
  firebase.database()
    .ref( 'rooms' )
    .off( 'child_removed' );

  let box = document.getElementById( 'roomsBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }
  /*
    if ( !document.getElementById( 'onlineDetails' )
      .open ) {
      document.getElementById( 'onlineBanner' )
        .click();
    }
  */
  disableSettings( false );

  let tutorialpar = document.createElement( 'h1' );
  tutorialpar.appendChild( document.createTextNode( 'Tutorials:' ) );
  box.appendChild( tutorialpar );

  let tutorialdiv = document.createElement( 'div' );
  tutorialdiv.id = 'tutorialdiv';
  tutorialdiv.style.whiteSpace = 'nowrap';
  tutorialdiv.style.overflow = 'auto';
  box.appendChild( tutorialdiv );

  box.appendChild( document.createElement( 'br' ) );

  let userUploadpar = document.createElement( 'h1' );
  userUploadpar.appendChild( document.createTextNode( 'User uploads:' ) );
  box.appendChild( userUploadpar );

  let uploadButton = document.createElement( 'button' );
  let hoverLabelAbove = document.createElement( 'span' );
  hoverLabelAbove.appendChild( document.createTextNode( 'You have to record something first.' ) );
  hoverLabelAbove.classList.add( 'hoverLabelAbove', 'FLATblack' );
  uploadButton.id = 'uploadRecordingButton';
  uploadButton.disabled = ( isEmpty( recordedKeypresses ) && !recordingNow );
  uploadButton.appendChild( document.createTextNode( 'Upload recording' ) );
  uploadButton.addEventListener( 'click', ( event ) => {
    uploadRecording();
  } );
  uploadButton.classList.add( 'I' );
  uploadButton.appendChild( hoverLabelAbove );
  box.appendChild( uploadButton );

  let uploadsdiv = document.createElement( 'div' );
  uploadsdiv.id = 'uploadsdiv';
  uploadsdiv.style.whiteSpace = 'nowrap';
  uploadsdiv.style.overflow = 'auto';
  box.appendChild( uploadsdiv );

  box.appendChild( document.createElement( 'br' ) );

  let roompar = document.createElement( 'h1' );
  roompar.appendChild( document.createTextNode( 'Live rooms:' ) );
  box.appendChild( roompar );

  let newButton = document.createElement( 'button' );
  newButton.appendChild( document.createTextNode( 'Create room' ) );
  newButton.addEventListener( 'click', ( event ) => {
    createRoom();
  } );
  newButton.classList.add( 'II' );

  box.appendChild( newButton );

  let roomsdiv = document.createElement( 'div' );
  roomsdiv.id = 'roomsdiv';
  roomsdiv.style.whiteSpace = 'nowrap';
  roomsdiv.style.overflow = 'auto';
  box.appendChild( roomsdiv );

  firebase.database()
    .ref( 'tutorials/names' )
    .once( 'value' )
    .then( function ( snapTutorials ) {

        let tutorials = snapTutorials.val();
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

              tutorialButton.classList.add( 'VII' );

              tutorialdiv.appendChild( tutorialButton );
            } );
        }
      },
      function ( error ) {
        console.error( "Couldn't load tutorial names.", error );
        document.getElementById( 'onlineOverlay' )
          .style.display = 'block';
        document.getElementById( 'onlineOverlayText' )
          .innerHTML = "Couldn't retrieve info from DB.<br>Please reload the page.";
        document.getElementById( 'onlineOverlayButton' )
          .style.display = 'none';
      } );

  firebase.database()
    .ref( 'uploads/names' )
    .on( 'child_added', function ( snapUpload ) {

      if ( roomName || inTutorial || inUserUpload ) {
        return;
      }

      let uploadButton = document.createElement( 'button' );
      uploadButton.classList.add( 'III' );
      uploadButton.appendChild( document.createTextNode( snapUpload.key ) );
      ( function ( snapUpload ) {
        uploadButton.addEventListener( 'click', ( event ) => {
          loadUserUpload( snapUpload.key )
        } );
      } )( snapUpload );

      let box = document.getElementById( 'uploadsdiv' );
      box.appendChild( uploadButton );
    } );

  firebase.database()
    .ref( 'rooms' )
    .on( 'child_added', function ( snapRoom ) {

      if ( roomName || inTutorial || inUserUpload ) {
        return;
      }

      let roomButton = document.createElement( 'button' );
      roomButton.classList.add( 'IV' );
      roomButton.appendChild( document.createTextNode( snapRoom.key ) );
      ( function ( snapRoom ) {
        roomButton.addEventListener( 'click', ( event ) => {
          joinRoom( snapRoom.key )
        } );
      } )( snapRoom );

      let box = document.getElementById( 'roomsdiv' );
      box.appendChild( roomButton );
    } );

  firebase.database()
    .ref( 'rooms' )
    .on( 'child_removed', function ( snapRoom ) {
      if ( roomName ) {
        return;
      }
      let roomButton = document.evaluate( '//button[text()="' + snapRoom.key + '"]',
        document, null, XPathResult.ANY_TYPE, null );
      roomButton = roomButton.iterateNext();
      if ( roomButton ) {
        roomButton.remove();
      }
    } );
}

// Comply to the settings sent by the tutorial or room admin.
function handleRemoteSettings( val ) {
  changeScale( val.scale );

  changeModeMechanic( val.mechanic );
  if ( modeMechanic == 'Progression' ) {
    selectedSequenceIndex = val.sequence;
    selectedSequence = sequenceList[ val.sequence ];
  }
  renderSequence();

  changeMode( 'Numpad' + ( val.mode + 1 ) );
}

// As admin, send your settings to the DB.
function broadcastSettings() {
  if ( roomName && iAmAdmin ) {
    firebase.database()
      .ref( 'settings/' + roomName )
      .set( {
        scale: currentScaleIndex,
        mechanic: modeMechanic,
        mode: currentModeIndex,
        sequence: selectedSequenceIndex
      } )
      .catch( function ( error ) {
        console.error( "Couldn't broadcast settings.", error );
      } );
  }
}


// RECORDING FUNCTIONS

// Start or stop the current recording.
function toggleRecording() {

  if ( recordingNow ) {
    document.getElementById( 'recordButton' )
      .innerHTML = 'Start recording';

    if ( !isEmpty( recordedKeypresses ) ) {
      document.getElementById( 'replayButton' )
        .disabled = false;
      document.getElementById( 'exportRecordingButton' )
        .disabled = false;
      if ( document.getElementById( 'uploadRecordingButton' ) ) {
        document.getElementById( 'uploadRecordingButton' )
          .disabled = false;
      }

      prepareExport();
    }

    disableSettings( false );
  } else {
    if ( !isEmpty( recordedKeypresses ) ) {
      if ( !confirm( 'This will delete the current recording.' ) ) {
        return;
      }
    }

    document.getElementById( 'recordButton' )
      .innerHTML = 'Stop recording';

    document.getElementById( 'replayButton' )
      .disabled = true;
    document.getElementById( 'exportRecordingButton' )
      .disabled = true;
    if ( document.getElementById( 'uploadRecordingButton' ) ) {
      document.getElementById( 'uploadRecordingButton' )
        .disabled = true;
    }

    disableSettings( true );

    recordedKeypresses = {};
    recordedKeypressesCount = 0;

    recordingSettings = {
      scale: currentScaleIndex,
      mechanic: modeMechanic,
      mode: currentModeIndex,
      sequence: selectedSequenceIndex
    };
  }

  document.getElementById( 'recordButton' )
    .classList.toggle( 'pulsating' );

  recordingNow = !recordingNow;
}

// Listen to the recording.
function replayRecording() {
  if ( !inUserUpload ) {
    playBackSpeed = 1;
  }

  window.scrollTo( 0, 0 );

  disableSettings( true );

  handleRemoteSettings( recordingSettings );

  userUploadKeypressSequence = [];

  Object.values( recordedKeypresses )
    .forEach( function ( keypress ) {
      userUploadKeypressSequence.push( keypress );
    } );

  remoteEvents = [];

  clearTimeout( scheduledEvent );
  scheduledEvent = null;
  document.querySelectorAll( '.key' )
    .forEach( function ( key ) {
      handleNoteStop( key.dataset[ 'code' ] );
    } );

  if ( userUploadKeypressSequence ) {
    userUploadKeypressSequence.forEach( function ( keypress ) {
      listenForRemoteEvents( keypress, 0 );
    } );
  }

  if ( !document.getElementById( 'onlineDetails' )
    .open ) {
    document.getElementById( 'onlineBanner' )
      .click();
  }

  let box = document.getElementById( 'roomsBox' );
  while ( box.firstChild ) {
    box.removeChild( box.firstChild );
  }

  let playBackSpeedDiv = document.createElement( 'div' );
  let playBackSpeedText = document.createElement( 'h1' );
  let playBackSpeedSlider = document.createElement( 'input' );

  playBackSpeedDiv.id = 'playBackSpeedDiv';

  playBackSpeedText.id = 'playBackSpeedText';
  playBackSpeedText.appendChild( document.createTextNode( 'Playback speed: ' + playBackSpeed.toFixed( 1 ) + 'x' ) );

  playBackSpeedSlider.id = 'playBackSpeedSlider';
  playBackSpeedSlider.type = 'range';
  playBackSpeedSlider.value = Math.round( 10 * playBackSpeed );
  playBackSpeedSlider.min = 1;
  playBackSpeedSlider.max = 20;
  playBackSpeedSlider.addEventListener( 'mousemove', function () {
    playBackSpeed = 0.1 * document.getElementById( 'playBackSpeedSlider' )
      .value;
    document.getElementById( 'playBackSpeedText' )
      .innerHTML = 'Playback speed: ' + playBackSpeed.toFixed( 1 ) + 'x';
  } );

  playBackSpeedDiv.appendChild( playBackSpeedText );
  playBackSpeedDiv.appendChild( playBackSpeedSlider );
  box.appendChild( playBackSpeedDiv );

  let leaveButton = document.createElement( 'button' );
  leaveButton.appendChild( document.createTextNode( 'Exit recording' ) );
  leaveButton.addEventListener( 'click', ( event ) => {
    exitTutorial();
  } );
  leaveButton.classList.add( 'V' );
  box.appendChild( leaveButton );

  let repeatButton = document.createElement( 'button' );
  repeatButton.appendChild( document.createTextNode( 'Repeat recording' ) );
  repeatButton.addEventListener( 'click', ( event ) => {
    replayRecording();
  } );
  repeatButton.classList.add( 'I' );
  box.appendChild( repeatButton );

  inUserUpload = true;

  updateChatListener();
}

// Uploads the recording to DB.
function uploadRecording() {
  if ( isEmpty( recordedKeypresses ) ) {
    return;
  }
  let uploadName = prompt( 'Enter the name of the recording' );
  if ( !uploadName ) {
    return;
  }

  firebase.database()
    .ref( 'uploads/names' )
    .once( 'value' )
    .then( function ( snap ) {

      let tutorials = snap.val();
      if ( tutorials ) {
        Object.keys( tutorials )
          .forEach( function ( name ) {
            if ( name == uploadName ) {
              if ( tutorials[ name ].owner == userID ) {
                if ( !confirm( 'You already uploaded a recording with this name. This will over-write it.' ) ) {
                  return;
                }
              } else {
                alert( 'Someone already picked that name!' );
                return;
              }
            }
          } );
      }

      let upload = {
        owner: userID,
        keypresses: recordedKeypresses,
        settings: recordingSettings
      };

      console.log( upload );

      firebase.database()
        .ref( 'uploads/names/' + uploadName )
        .set( {
          owner: userID
        } )
        .then( function () {

          firebase.database()
            .ref( 'uploads/data/' + uploadName )
            .set( upload )
            .catch( function ( error ) {
              console.error( "Couldn't upload recording.", error );

              firebase.database()
                .ref( 'uploads/names/' + uploadName )
                .remove()
                .catch( function ( error ) {
                  console.error( "Couldn't roll back...", error );
                } );

              fadeOutOverlay( "Couldn't upload recording.<br>Try again later or reload the page." );
            } );
        }, function ( error ) {
          console.error( "Couldn't upload recording.", error );

          fadeOutOverlay( "Couldn't upload recording.<br>Try again later or reload the page." );
        } );
    }, function ( error ) {
      console.error( "Couldn't retrieve upload names.", error );

      fadeOutOverlay( "Couldn't upload recording.<br>Try again later or reload the page." );
    } );
}

// Exports the recording as a JSON file.
function prepareExport() {
  if ( isEmpty( recordedKeypresses ) ) {
    return;
  }

  let data = {
    owner: userID,
    keypresses: recordedKeypresses,
    settings: recordingSettings
  };

  let dataString = "data:text/json;charset=utf-8," + encodeURIComponent( JSON.stringify( data ) );
  let anchorElement = document.getElementById( 'exportRecordingAnchor' );
  anchorElement.href = dataString;

  document.getElementById( 'exportRecordingButton' )
    .disabled = false;
}

// Load a user-provided JSON in memory
function handleImport() {
  let input = document.getElementById( 'importRecordingInput' );
  // So onchange will be triggered even by the same file
  input.parentNode.innerHTML = 'Import JSON file <input id="importRecordingInput" type="file" value="Import" onchange="handleImport();">';

  let files = input.files;

  if ( input.length <= 0 ) {
    recordedKeypresses = {};
    document.getElementById( 'replayButton' )
      .disabled = true;
    document.getElementById( 'exportRecordingButton' )
      .disabled = true;
    if ( document.getElementById( 'uploadRecordingButton' ) ) {
      document.getElementById( 'uploadRecordingButton' )
        .disabled = true;
    }
    return;
  }

  let fr = new FileReader();

  fr.onload = function ( e ) {
    let result = JSON.parse( e.target.result );

    try {
      recordedKeypresses = result[ 'keypresses' ];
      recordingSettings = result[ 'settings' ];
    } catch ( error ) {
      console.error( 'Unsupported format.', error );
      giveSnack( 'Unsupported format.', 'V' );
      return;
    }

    if ( !recordedKeypresses || !recordingSettings ) {
      giveSnack( 'Unsupported format.', 'V' );
      return;
    }

    if ( isEmpty( recordedKeypresses ) ) {
      document.getElementById( 'replayButton' )
        .disabled = true;
      document.getElementById( 'exportRecordingButton' )
        .disabled = true;
      if ( document.getElementById( 'uploadRecordingButton' ) ) {
        document.getElementById( 'uploadRecordingButton' )
          .disabled = true;
      }
    } else {
      document.getElementById( 'replayButton' )
        .disabled = false;
      document.getElementById( 'exportRecordingButton' )
        .disabled = false;
      if ( document.getElementById( 'uploadRecordingButton' ) ) {
        document.getElementById( 'uploadRecordingButton' )
          .disabled = false;
      }

      replayRecording();
    }
  }

  fr.readAsText( files.item( 0 ) );
}

// Retrieve the data for one tutorial (in bunch) and store it in variables.
// Update the graphic interface and start the first tutorial step.
function loadUserUpload( name ) {

  if ( roomName || !name || inTutorial ) {
    return;
  }

  if ( !inUserUpload ) {
    playBackSpeed = 1;
  }

  firebase.database()
    .ref( 'uploads/data/' + name )
    .once( 'value' )
    .then( function ( snap ) {

      disableSettings( true );

      handleRemoteSettings( snap.child( 'settings' )
        .val() );

      userUploadKeypressSequence = [];

      snap.child( 'keypresses' )
        .forEach( function ( keypressSnap ) {
          userUploadKeypressSequence.push( keypressSnap );
        } );

      remoteEvents = [];

      clearTimeout( scheduledEvent );
      scheduledEvent = null;
      document.querySelectorAll( '.key' )
        .forEach( function ( key ) {
          handleNoteStop( key.dataset[ 'code' ] );
        } );

      if ( userUploadKeypressSequence ) {
        userUploadKeypressSequence.forEach( function ( keypressSnap ) {
          listenForRemoteEvents( keypressSnap.val(), 0 );
        } );
      }

      if ( !document.getElementById( 'onlineDetails' )
        .open ) {
        document.getElementById( 'onlineBanner' )
          .click();
      }

      let box = document.getElementById( 'roomsBox' );
      while ( box.firstChild ) {
        box.removeChild( box.firstChild );
      }

      let playBackSpeedDiv = document.createElement( 'div' );
      let playBackSpeedText = document.createElement( 'h1' );
      let playBackSpeedSlider = document.createElement( 'input' );

      playBackSpeedDiv.id = 'playBackSpeedDiv';

      playBackSpeedText.id = 'playBackSpeedText';
      playBackSpeedText.appendChild( document.createTextNode( 'Playback speed: ' + playBackSpeed.toFixed( 1 ) + 'x' ) );

      playBackSpeedSlider.id = 'playBackSpeedSlider';
      playBackSpeedSlider.type = 'range';
      playBackSpeedSlider.value = Math.round( 10 * playBackSpeed );
      playBackSpeedSlider.min = 1;
      playBackSpeedSlider.max = 20;
      playBackSpeedSlider.addEventListener( 'mousemove', function () {
        playBackSpeed = 0.1 * document.getElementById( 'playBackSpeedSlider' )
          .value;
        document.getElementById( 'playBackSpeedText' )
          .innerHTML = 'Playback speed: ' + playBackSpeed.toFixed( 1 ) + 'x';
      } );

      playBackSpeedDiv.appendChild( playBackSpeedText );
      playBackSpeedDiv.appendChild( playBackSpeedSlider );
      box.appendChild( playBackSpeedDiv );

      let leaveButton = document.createElement( 'button' );
      leaveButton.appendChild( document.createTextNode( 'Exit recording' ) );
      leaveButton.addEventListener( 'click', ( event ) => {
        exitTutorial();
      } );
      leaveButton.classList.add( 'V' );
      box.appendChild( leaveButton );

      let repeatButton = document.createElement( 'button' );
      repeatButton.appendChild( document.createTextNode( 'Repeat recording' ) );
      ( function ( name ) {
        repeatButton.addEventListener( 'click', ( event ) => {
          loadUserUpload( name );
        } );
      } )( name );
      repeatButton.classList.add( 'I' );
      box.appendChild( repeatButton );

      inUserUpload = true;

      updateChatListener();

    }, function ( error ) {
      console.error( "Couldn't load tutorial.", error );

      fadeOutOverlay( "Couldn't load recording.<br>Try again later or reload the page." );
    } );
}


// JAVASCRIPT IS A TERRIBLE LANGUAGE

// The following allows to know if an object is empty.
// Thanks, stackoverflow.

// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty( obj ) {

  // null and undefined are "empty"
  if ( obj == null ) return true;

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if ( obj.length > 0 ) return false;
  if ( obj.length === 0 ) return true;

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if ( typeof obj !== "object" ) return true;

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  for ( var key in obj ) {
    if ( hasOwnProperty.call( obj, key ) ) return false;
  }

  return true;
}