/*jshint sub:true */

var GithubEventParser = require('../lib/GithubEventParser'),
    HttpStatusCodes = require('../lib/HttpStatusCodes'),
    GitHubListenerAuthentication = require('../lib/GitHubListenerAuthentication'),
    AUTHORIZATION_SCHEME = 'GitHubListener',
    storage, configuration, io;

function createNotification(req, res, next) {
    var parser = new GithubEventParser(req.log, storage, configuration);

    if (parser.supports(req.headers)) {
        parser.analyze(req.headers, req.params);
        res.send(HttpStatusCodes['Accepted']);
    } else {
        res.send(HttpStatusCodes['Bad Request']);
    }

    next();
}

function getNotifications(req, res, next) {
    if (req.authorization.scheme !== AUTHORIZATION_SCHEME) {
        req.log.debug('Client requesting notifications without the right header.\nThe Authorization header is:\n', req.authorization);
        res.header('WWW-Authenticate', AUTHORIZATION_SCHEME);
        res.send(HttpStatusCodes['Unauthorized']);
        next();
    } else {
        var installationId = GitHubListenerAuthentication.getCredentials(req.authorization.credentials);

        getNotificationsFor(installationId).
            then(function(notifications) {
                req.log.debug('Sending back %d notifications for %s', notifications.commits.length, installationId);
                res.send(HttpStatusCodes['OK'], notifications);
            }).
            catch(function(error) {
                req.log.error({ err: error }, 'github-listener: an error occurred while retrieving notification from the database');
            }).
            finally(function() {
                next();
            }).done();
    }
}

function getNotificationsFor(installationId) {
    var notifications = { commits: []};

    return storage.getNotificationsFor(installationId).
        then(function(retrievedNotifications) {
            notifications = retrievedNotifications;
            return storage.updateLastseen(installationId);
        }).then(function() {
             return notifications;
        }).catch(function(error) {
            throw new Error(error);
        });
}

var Setup = function(params) {
    storage = params.storage;
    configuration = params.configuration;
    io = params.io;
    ee = params.ee;

    params.server.post('/v1/notifications', createNotification);
    params.server.get('/v1/notifications', getNotifications);
};

module.exports = Setup;
