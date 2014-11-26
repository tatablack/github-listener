var configuration,
    storage,
    log,
    io,
    ee,
    activeConnections = {};

// Clients connect and, soon after, register.
// They username is sent only the first time,
// so we use it to determine if it's a new user.
// If not, we update an existing record.
// In both cases, afterwards we associate the user
// with the new connection.
var register = function(data) {
    storage[ data.username ? 'createUser' : 'updateUser'](data).then(associateUserAndConnection.bind(this));
};

// We keep a list of active connections,
// and the user data associated with each one.
var associateUserAndConnection = function(user) {
    activeConnections[this.id] = user;
    log.info('Associated connection with socketId %s with user %s', this.id, user);
};

// In order to broadcast, we need to retrieve new notifications,
// update the lastSeen flag, and then broadcast to each connected user.
var broadcastNotifications = function() {
    for (var socketId in activeConnections) {
        var installationId = activeConnections[socketId].installationId,
            notifications = { commits: [] };

        log.debug('About to broadcast to %s', installationId);

        storage.getNotificationsFor(installationId).
            then(updateLastSeenFor(installationId, notifications)).
            then(broadcastToSocket(socketId, notifications)).catch(throwError);
    }
};

var throwError = function(error) {
    throw new Error(error);
};

var broadcastToSocket = function(socketId, notifications) {
    return function() {
        log.debug('broadcasting to %s', socketId);
        io.to(socketId).emit('commitsReceived', notifications);
        return true;
    };
};

var updateLastSeenFor = function(installationId, notifications) {
    return function(retrievedNotifications) {
        notifications = retrievedNotifications;
        return storage.updateLastseen(installationId);
    };
};

var cleanup = function() {
    log.debug('About to remove connection with socketId %s', this.id);
    delete activeConnections[this.id];
};

var Setup = function(params) {
    configuration = params.configuration;
    storage = params.storage;
    io = params.io;
    ee = params.ee;
    log = params.server.log;

    ee.on('incomingPayload', broadcastNotifications);

    io.sockets.on('connection', function(socket) {
        log.info('New client connected');

        socket.on('registration', register.bind(socket));
        socket.on('disconnect', cleanup.bind(socket));
    });
};

module.exports = Setup;
