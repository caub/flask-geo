
var http = require('http'),
	sio = require('socket.io'),
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

var app = http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end("nodejs");
}).listen(8000);

var io = sio.listen(app),
	nicknames = {};

io.sockets.on('connection', function (socket) {
	var address = socket.handshake.address;
    console.log("New connection from " + address.address + ":" + address.port);
    socket.on('hello', function (nick) {
    	if (!nicknames[nick]){
			nicknames[nick] = socket.nickname = nick;
			socket.broadcast.emit('sub', {text: nick + ' connected'});
    	}
	});
	socket.on('pub', function (data) {
		console.log(data);
		io.sockets.emit('sub', data);
	});
	socket.on('disconnect', function () {
		if (!socket.nickname) return;
		delete nicknames[socket.nickname];
		socket.broadcast.emit('sub', {text:socket.nickname + ' disconnected'});
	});
});

