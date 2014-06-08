var _ = require('lodash'),
    HttpStatusCodes = require('./HttpStatusCodes'),
    GitHubPayloadParser = require('./GitHubPayloadParser');

var GithubEventParser = function(log, storage) {
    this.log = log;
    this.payloadParser = new GitHubPayloadParser(log, storage);
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
                this.payloadParser.parse(params.payload);
            } catch(err) {
                this.log.error({ err: err }, 'An error occurred while parsing the payload');
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
