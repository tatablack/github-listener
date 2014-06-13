/*jshint sub:true */

var HttpStatusCodes = require('../lib/HttpStatusCodes');

var configuration,
    capabilities = {
    _links: {
        self: {
            href: '/v1',
            title: 'Starting point of GitHub Listener API'
        },

        notifications: {
            href: '/v1/notifications',
            title: 'Notifications of GitHub events'
        }
    },
    
    message: 'Github Listener here. I am a GitHub WebHook!'
};

function getCapabilities() {
    'use strict';
    
    capabilities.server = {
        version: configuration.get('version')
    };
    
    return capabilities;
}

// Default handler
function handleDefault(req, res, next) {
    res.send(HttpStatusCodes['OK'], getCapabilities());
    next();
}

var Setup = function(params) {
    configuration = params.configuration;
    
    params.server.get('/v1', handleDefault);
};

module.exports = Setup;
