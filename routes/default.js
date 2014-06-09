var configuration,
    capabilities = {
    _links: {
        self: {
            href: '/v1',
            title: 'Starting poing of GitHub Listener API'
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

function handleRoot(req, res, next) {
    'use strict';
    
    res.send(403);
    next();
}

// Default handler
function handleDefault(req, res, next) {
    res.send(200, getCapabilities());
    next();
}

var Setup = function(params) {
    configuration = params.configuration;
    
    params.server.get('/', handleRoot);
    params.server.get('/v1', handleDefault);    
};

module.exports = Setup;
