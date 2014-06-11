var HttpStatusCodes = require('../lib/HttpStatusCodes'),
    storage;

function handleUserCreation(req, res, next) {
    'use strict';
    
    storage.createUser(req.params).then(function() {
        res.send(HttpStatusCodes['Created']);
        next();
    });
}

function handleUserUpdate(req, res, next) {
    'use strict';
    
    storage.updateUser(req.params).then(function() {
        res.send(HttpStatusCodes['No Content']);
        next();
    });
}

var Setup = function(params) {
    storage = params.storage;
    
    params.server.put('/v1/users/:installationId', handleUserUpdate);
    params.server.post('/v1/users', handleUserCreation);
};

module.exports = Setup;
