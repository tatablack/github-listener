var restify = require('restify');

function handleNotification(req, res, next) {
    console.log(req.params);
    res.send(204);
    next();
}

var server = restify.createServer();
server.use(restify.bodyParser());

server.post('/notify', handleNotification);

server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
