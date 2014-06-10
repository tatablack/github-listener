var storage;

function handleUserCreation(req, res, next) {
    'use strict';
    
    storage.createUser(req.params).then(function() {
        res.send(201);
        next();
    });
}

var Setup = function(params) {
    storage = params.storage;
    
    params.server.post('/users', handleUserCreation);
};

module.exports = Setup;
