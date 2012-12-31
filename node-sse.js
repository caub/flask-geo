
var app = require('http'),,
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

var queue = [], clients = {};

http.createServer(function(req, res) {
	
	if (req.headers.accept && req.headers.accept == 'text/event-stream') {
		console.log('url '+req.url);

		if (req.url == '/events') {
			sendSSE(req, res);
		  
		} else {
			res.writeHead(404);
			res.end();
		}
	} else {
		console.log('url '+req.url);
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
		console.log('notify of '+queue);
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

console.log('Server running');
