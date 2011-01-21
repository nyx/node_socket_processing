var app = function() {
  var who = null;
  var state = [];
  var processing = null;
  var dimmer = 240;
  // called when server welcomes this client
  var onWelcome = function(data) {
    console.log('welcome'+data['who']);
    who = data['who'];
    state = data['state'];
  }
  // called when another client enters the world
  var onEnter = function(data) {
    console.log('enter'+data['who']);
    state[data['who']] = data['state'];
  }
  // called when another client exits the world
  var onExit = function(data) {
    console.log('exit');
    delete state[data['who']];
  }
  // called when move message received from the server
  var onMove = function(data) {
    //console.log('move');
    state[data['who']]['pos'] = data['pos'];
  }
  // called when mouse moves inside the canvas as result of user input
  var moved = function(socket, x, y) {
    var whoPos = state[who]['pos'];
    whoPos[0] = x;
    whoPos[1] = y;
    socket.send({'who':who, 'pos': whoPos});
  }
  // map message event type to handler
  var messageHandlers = {
    'welcome' : onWelcome,
    'enter'   : onEnter,
    'exit'    : onExit,
    'move'    : onMove
  };
  // primary drawing procedure
  var drawProc = function() {
    var p = processing;
    dimmer = (200 + dimmer) * 0.5;
    p.background(dimmer);
    p.noFill();
    for(c in state) {
      var s = state[c];
      var color = s['color'];
      p.stroke(color[0]*255, color[1]*255, color[2]*255);
      p.strokeWeight(10);
      p.ellipse(s['pos'][0], s['pos'][1], 30, 30);
    }
    p.fill(245,10,10, 128);
    p.stroke(255,0,0, 128);
    p.strokeWeight(2);
    p.ellipse(p.mouseX, p.mouseY, 4, 4);
  };
  // drawing procedure activated when server disconnects
  var darkDrawProc = function() {
    dimmer = (50 + dimmer) * 0.5;
    processing.background(dimmer);
  }
  var socket = new io.Socket();
  // called when client is connected to the server
  socket.on('connect', function(){
    console.log('connected!');
    // setup processing on first message from server
    var sketch = function(processing) {
      // Override draw function, by default it will be called 60 times per second
      processing.draw = drawProc;
      processing.mouseMoved = function() {
        moved(socket, processing.mouseX, processing.mouseY);
      }
    }
    var canvas = document.getElementById("canvas1");
    processing = new Processing(canvas, sketch);
    processing.frameRate(30);
  });
  // called when server disconnects
  socket.on('disconnect', function(){
    console.log('disconnected');
    if(processing) {
      processing.draw = darkDrawProc;
    }
  });
  // called when server sends message to this client
  socket.on('message', function(data){
    messageHandler = messageHandlers[data['event']];
    if(messageHandler) {
      messageHandler(data);
    } else {
      console.log('ignoring unrecognized event type: ' + data['event']);
    }
  });

  socket.connect();
  // return accessor into internals
  var r = {};
  r.who = who;
  r.state = state;
  r.socket = socket;
  r.processing = processing;
  return r;
}();

