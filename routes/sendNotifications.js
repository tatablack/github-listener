var storage;

// Default  notification handler
function handleNotifications(req, res, next) {
    res.send(200, 'Yo');
    next();
}

var Setup = function(params) {
    storage = params.storage;
    params.server.get('/notifications/:username', handleNotifications);
};

module.exports = Setup;
