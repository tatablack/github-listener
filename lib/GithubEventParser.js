var _ = require('lodash'),
    HttpStatusCodes = require('./HttpStatusCodes');

var GithubEventParser = function() {};

_.extend(GithubEventParser.prototype, {
    knownGithubHeaders: {
        event: 'x-github-event',
        delivery: 'x-github-delibery',
        signature: 'x-hub-signature'
    },

    supportedEvents: ['push'],
    
    getEventType: function(headers) {
        var event = headers[this.knownGithubHeaders.event];
        if (!_.contains(this.supportedEvents, event)) return 'Unsupported';
        
        return event.charAt(0).toUpperCase() + event.substring(1);
    },

    analyze: function(headers, params) {
        return this['handle' + this.getEventType(headers)](params);
    },
    
    handlePush: function(params) {
        if (params.payload) {
            try {
                var payload = JSON.parse(params.payload);
                
                _.each(payload.commits, function(commit) {
                    console.log(commit.message);
                });
            } catch(parseError) {
                console.log(parseError);
            }
        }
        
        return HttpStatusCodes['No Content'];
    },
    
    handleUnsupported: function() {
        return HttpStatusCodes['Bad Request'];
    }
});

module.exports = GithubEventParser;
