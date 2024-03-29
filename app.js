'use strict';

// Set up dependencies
var fs = require('fs'),
    _ = require('lodash'),
    restify = require('restify'),
    bunyan = require('bunyan'),
    nconf = require('nconf'),
    EventEmitter = require('events').EventEmitter,
    Storage = require('./lib/Storage');

// Load configuration
nconf.argv().env().
    file('localConfig', { file: __dirname + '/localConfig.json' }).
    file('config', { file: __dirname + '/config.json' }).
    file('package', { file: __dirname + '/package.json' });

// Set up logging
var restifyLog = bunyan.createLogger({
    name: 'RestifyLogger',
    level: 'debug',
    serializers: bunyan.stdSerializers,
    streams: [{
        path: __dirname + '/' + nconf.get('logs').application
    }]
});

// Server initialization
var server = restify.createServer({ name: 'github-listener', log: restifyLog });
server.use(restify.authorizationParser());
server.use(restify.bodyParser());
server.use(restify.gzipResponse());
server.use(restify.requestLogger());

// WebSockets server initialization
var io = require('socket.io')(server, { serveClient: false });

// EventEmitter initialization
var ee = new EventEmitter();

// Data layer initialization
var storage = new Storage(restifyLog);
storage.init(ee);

// Initialize routing
[
    '/routes/default',
    '/routes/users',
    '/routes/notifications',
    '/routes/websockets'
].forEach(function(route) {
    require(__dirname + route)({
        server: server,
        io: io,
        ee: ee,
        storage: storage,
        configuration: nconf
   });
});

// Startup
server.listen(3300, function() {
    console.log('%s listening at %s', server.name, server.url);

    fs.writeFile(server.name + '.pid', process.pid, function(err) {
        if (err) throw err;
    });
});
