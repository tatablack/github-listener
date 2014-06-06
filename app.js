var _ = require('lodash'),
    restify = require('restify'),
    GithubEventParser = require('./lib/GithubEventParser');

function handleNotification(req, res, next) {
    var parser = new GithubEventParser();

    res.send(
        parser.analyze(req.headers, req.params)
    );
    next();
}

var server = restify.createServer();
server.use(restify.bodyParser());

server.post('/notify', handleNotification);

server.listen(3300, function() {
    console.log('%s listening at %s', server.name, server.url);
});
