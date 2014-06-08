var storage;

// Default  notification handler
function handleNotifications(req, res, next) {
    req.log.info('Client requesting notifications for %s', req.params.username);
    
    storage.getNotificationsFor(req.params.username).then(function(notifications) {
        req.log.info('Sending back %d notifications', notifications.length);
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
    params.server.get('/notifications/:username', handleNotifications);
};

module.exports = Setup;
