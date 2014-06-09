'use strict';

// Set up dependencies
var _ = require('lodash'),
    restify = require('restify'),
    bunyan = require('bunyan'),
    nconf = require('nconf'),
    Storage = require('./lib/Storage');

// Load configuration
nconf.argv().env().
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

// Data layer initialization
var storage = new Storage(restifyLog);
storage.init();

// Server initialization
var server = restify.createServer({ name: 'github-listener', log: restifyLog });
server.use(restify.bodyParser());
server.use(restify.gzipResponse());
server.use(restify.requestLogger());

// Initialize routing
[
    '/routes/default',
    '/routes/notifications'
].forEach(function(route) {
    require(__dirname + route)({
        server: server,
        storage: storage,
        configuration: nconf
   });
});

// Startup
server.listen(3300, function() {
    console.log('%s listening at %s', server.name, server.url);
});
