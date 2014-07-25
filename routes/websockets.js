var configuration,
    io;

var Setup = function(params) {
    configuration = params.configuration;
    io = require('socket.io')(params.server);

    io.sockets.on('connection', function(socket) {
    });
};

module.exports = Setup;
