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

function handleDefault(req, res) {
    res.send(200, 'Github Listener here. Hi, I\'m a webhook!');
}

var server = restify.createServer();
server.use(restify.bodyParser());

server.get('/', handleDefault);
server.post('/notify', handleNotification);

server.listen(3300, function() {
    console.log('%s listening at %s', server.name, server.url);
});
