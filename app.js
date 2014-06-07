'use strict';

// Set up dependencies
var _ = require('lodash'),
    restify = require('restify'),
    bunyan = require('bunyan'),
    nconf = require('nconf'),
    Storage = require('./lib/Storage'),
    GithubEventParser = require('./lib/GithubEventParser');

// Load configuration
nconf.argv().env().file({ file: __dirname + '/config.json' });

// Set up logging
var restifyLog = bunyan.createLogger({
    name: 'RestifyLogger',
    level: 'info',
    serializers: bunyan.stdSerializers,
    streams: [{
        path: __dirname + '/' + nconf.get('logs').application
    }]
});

// Data layer initialization
var storage = new Storage(restifyLog);
storage.init();


// Default request handler
function handleDefault(req, res) {
    res.send(200, 'Github Listener here. Hi, I\'m a webhook!');
}

// Default  notification handler
function handleNotification(req, res, next) {
    var parser = new GithubEventParser(req.log, storage);

    res.send(parser.analyze(req.headers, req.params));
    next();
}

// Server initialization
var server = restify.createServer({ name: 'github-listener', log: restifyLog });
server.use(restify.bodyParser());
server.use(restify.gzipResponse());
server.use(restify.requestLogger());

// Initialize routing
server.get('/', handleDefault);
server.post('/notify', handleNotification);

// Startup
server.listen(3300, function() {
    console.log('%s listening at %s', server.name, server.url);
});
