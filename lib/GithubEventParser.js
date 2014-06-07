var _ = require('lodash'),
    HttpStatusCodes = require('./HttpStatusCodes');

var GithubEventParser = function() {};

_.extend(GithubEventParser.prototype, {
    knownGithubHeaders: {
        event: 'x-github-event',
        delivery: 'x-github-delivery',
        signature: 'x-hub-signature'
    },

    supportedEvents: ['push'],
    
    analyze: function(req) {
        return this['handle' + this.getEventType(req)](req);
    },
    
    getEventType: function(req) {
        var event = req.headers[this.knownGithubHeaders.event];
        if (!_.contains(this.supportedEvents, event)) return 'Unsupported';
        
        return event.charAt(0).toUpperCase() + event.substring(1);
    },

    handlePush: function(req) {
        var params = req.params;
        
        if (params.payload) {
            try {
                var payload = JSON.parse(params.payload);
                
                _.each(payload.commits, function(commit) {
                    console.log(when + ', ' + commit.message);
                });
                
                req.log.info('Received %d commits from %s', payload.commits.length, payload.repository.name);
            } catch(parseError) {
                req.log.error(parseError);
                return HttpStatusCodes['Bad Request'];
            }
        }
        
        return HttpStatusCodes['No Content'];
    },
    
    handleUnsupported: function() {
        return HttpStatusCodes['Bad Request'];
    }
});

module.exports = GithubEventParser;
