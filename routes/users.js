var storage;

function handleUserCreation(req, res, next) {
    'use strict';
    
    storage.createUser(req.params).then(function() {
        res.send(HttpStatusCodes['Created']);
        next();
    });
}

function handleUserUpdate() {
    'use strict';
    
    storage.updateUser(req.params).then(function() {
        res.send(HttpStatusCodes['No Content']);
        next();
    });
}

var Setup = function(params) {
    storage = params.storage;
    
    params.server.put('/users/:installationId', handleUserUpdate);
    params.server.post('/users', handleUserCreation);
};

module.exports = Setup;
