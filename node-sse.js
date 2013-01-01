
var http = require('http');
var fs = require('fs');

var queue = [], clients = {};

http.createServer(function(req, res) {
	console.log('IP '+req.connection.remoteAddress);
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
			queue.push("> "+req.headers['user-agent']);
		}
		res.writeHead(200, {'Content-Type': 'text/html'});
	    res.write(fs.readFileSync(__dirname + '/node-sse.html'));
	    res.end();
	}
}).listen(80);


function sendSSE(req, res) {
	
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
			clients[i].write('id: '+new Date()+'\ndata: ' + entry + '\n\n');
		}
	}
}, 1000);


console.log('Server running');
