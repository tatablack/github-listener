var storage;

function handleInstallation(req, res, next) {
    'use strict';
    
    storage.createInstallation(req.params).then(function(installation) {
        res.send(201, installation);
        next();
    });
}

var Setup = function(params) {
    storage = params.storage;
    
    params.server.post('/installations', handleInstallation);
};

module.exports = Setup;
