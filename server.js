var server = function() {
  var http = require('http'),
        io = require('socket.io'),
        fs = require('fs')

  var urls = {
    '/favicon.ico'   : ['image/x-icon',    fs.readFileSync('favicon.ico')],
    '/client.js'     : ['text/javascript', fs.readFileSync('client.js')],
    '/processing.js' : ['text/javascript', fs.readFileSync('processing-1.0.0.js')],
    '/'              : ['text/html',       fs.readFileSync('index.html')]
  }

  var server = http.createServer(function(req, res){
    var data = urls[req.url] || ['text/html','Not Found'];
    res.writeHead(200, {'Content-Type': data[0]});
    res.write(data[1]);
    res.end();
  });
  server.listen(3000,"127.0.0.1");

  var clients = {};
  var state = {};

  // called when new client connects
  var clientConnected = function(client) {
    var newState = {
      'sessionId' : client.sessionId,
      'color' : [Math.random(), Math.random(), Math.random()],
      'pos' : [10 * Math.random(), 10 * Math.random()]}
    clients[client.sessionId] = client;
    state[client.sessionId] = newState;
    // new client gets full game state
    client.send({'event':'welcome', 'who': client.sessionId, 'state':state});
    for(c in clients) {
      if(c != client.sessionId) {
        // all other clients get only new client state
        clients[c].send({'event':'enter', 'who': client.sessionId, 'state':newState});
      }
    }
  }
  // called when existing client disconnects
  var clientDisconnected = function(client) {
    delete clients[client.sessionId];
    delete state[client.sessionId];
    // notify all clients this one's gone
    for(c in clients) {
      clients[c].send({'event':'exit', 'who': client.sessionId});
    }
  }
  // called when client data is recieved
  var clientMessaged = function(client, data) {
    state[client.sessionId]['pos'] = data['pos'];
    // notify all clients of new data
    for(c in clients) {
      // send just the data that changed to everyone but the changer
      if(c != client.sessionId) {
        clients[c].send({'event':'move', 'who': data['who'], 'pos':data['pos']});
      }
    }
  }
  // socket.io server
  var socket = io.listen(server);
  socket.on('connection', function(client){
    clientConnected(client);
    client.on('message', function(data){
      clientMessaged(client,data);
    });
    client.on('disconnect', function(){
      clientDisconnected(client);
    });
  });
  // return accessor into internals
  var r = {};
  return r;
}();