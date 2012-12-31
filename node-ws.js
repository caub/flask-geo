
var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	//fs = require('fs'),
	httpProxy = require('http-proxy');

var options = {
	router: {
		'mymed20.sophia.inria.fr/node': '127.0.0.1:8000/node',
		'mymed20.sophia.inria.fr/socket.io': '127.0.0.1:8000/socket.io',
		'mymed20.sophia.inria.fr/*': '127.0.0.1:81'
	}
};

var proxyServer = httpProxy.createServer(options);
proxyServer.listen(80);


app.listen(8000);

var subscribers = {};
function handler (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end("nodejs");
}

io.sockets.on('connection', function (socket) {
	var address = socket.handshake.address;

	subscribers[address.address] = socket;

    console.log("New connection from " + address.address + ":" + address.port);
    socket.emit('sub', { author: address.address });
	socket.on('pub', function (data) {
		data['author'] = address.address;
		console.log(data);
		for (var i in subscribers){
			subscribers[i].emit('sub', data);
		}
	});
});


/*var queue = [], clients = {};

http.createServer(function(req, res) {
	
	if (req.headers.accept && req.headers.accept == 'text/event-stream') {
		sys.puts('url '+req.url);

		if (req.url == '/events') {
			sendSSE(req, res);
		  
		} else {
			res.writeHead(404);
			res.end();
		}
	} else {
		sys.puts('url '+req.url);
		if (req.url !== '/favicon.ico'){
			queue.push(req.url);
		}

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write("send a sse with:"+req.url);
		res.end();
	}
}).listen(8000);


function sendSSE(req, res) {

	//sys.puts(req.connection);
	
	clients[req.connection.remoteAddress] = res;

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	 });

	req.on( 'close', function() {
		delete clients[req.connection.remoteAddress];
		//clients.splice( req.id - 1, 1 );
	});
  
  
	//res.end(); never ends
}

setInterval(function() {
	if(queue.length){
		sys.puts('notify of '+queue);
		var entry = queue.pop();
		for (var i in clients) {
			clients[i].write("data: " + entry + '\n\n');
		}
	}
}, 1000);

Object.empty = function ( obj ) {
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) return false;
    }
    return true;
};

console.log('Server running');*/
