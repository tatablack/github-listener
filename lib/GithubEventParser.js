var _ = require('lodash'),
    HttpStatusCodes = require('./HttpStatusCodes');

var GithubEventParser = function(log) {
    this.log = log;
};

_.extend(GithubEventParser.prototype, {
    knownGithubHeaders: {
        event: 'x-github-event',
        delivery: 'x-github-delivery',
        signature: 'x-hub-signature'
    },

    supportedEvents: ['push'],
    
    analyze: function(headers, params) {
        return this['handle' + this.getEventType(headers)](params);
    },
    
    getEventType: function(headers) {
        var event = headers[this.knownGithubHeaders.event];
        if (!_.contains(this.supportedEvents, event)) return 'Unsupported';
        
        return event.charAt(0).toUpperCase() + event.substring(1);
    },

    handlePush: function(params) {
        if (params.payload) {
            try {
                var payload = JSON.parse(params.payload);
                
                _.each(payload.commits, function(commit) {
                    this.log.info(commit.message);
                }, this);
                
                this.log.info('Received %d commits from %s', payload.commits.length, payload.repository.name);
            } catch(parseError) {
                this.log.error(parseError);
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
