var GithubEventParser = require('../lib/GithubEventParser'),
    storage;

function createNotification(req, res, next) {
    var parser = new GithubEventParser(req.log, storage);

    res.send(parser.analyze(req.headers, req.params));
    next();
}

function getNotifications(req, res, next) {
    req.log.debug('Client requesting notifications for %s', req.params.username);
    
    storage.getNotificationsFor(req.params.username).then(function(notifications) {
        req.log.debug('Sending back %d notifications', notifications.commits.length);
        res.send(200, notifications);
    }).
    catch(function(error) {
        req.log.error({ err: error }, 'github-listener: an error occurred while retrieving notification from the database');
    }).
    finally(function() {
        next();
    }).done();
}

var Setup = function(params) {
    storage = params.storage;
    params.server.post('/v1/notifications', createNotification);
    params.server.get('/v1/notifications/:username', getNotifications);
};

module.exports = Setup;