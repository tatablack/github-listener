var GithubEventParser = require('../lib/GithubEventParser'),
    storage;

// Default  notification handler
function handleNotification(req, res, next) {
    var parser = new GithubEventParser(req.log, storage);

    res.send(parser.analyze(req.headers, req.params));
    next();
}

var Setup = function(params) {
    storage = params.storage;
    params.server.post('/notify', handleNotification);
};

module.exports = Setup;
