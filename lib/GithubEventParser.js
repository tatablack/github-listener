var _ = require('lodash'),
    GitHubPayloadParser = require('./GitHubPayloadParser');

var GithubEventParser = function(log, storage, configuration) {
    this.log = log;
    this.payloadParser = new GitHubPayloadParser(log, storage, configuration);
};

_.extend(GithubEventParser.prototype, {
    knownGithubHeaders: {
        event: 'x-github-event',
        delivery: 'x-github-delivery',
        signature: 'x-hub-signature'
    },

    supportedEvents: ['push'],
    
    analyze: function(headers, params) {
        if (this.supports(headers)) {
            this['handle' + this.getEventType(headers)](params, headers);
        }
    },
    
    supports: function(headers) {
        var event = headers[this.knownGithubHeaders.event],
            isSupported = _.contains(this.supportedEvents, event);
        
        if (!isSupported) { this.log.debug('Received a payload for the unsupported \'%s\' event', event); }
        
        return isSupported;
    },
    
    getEventType: function(headers) {
        var event = headers[this.knownGithubHeaders.event];

        return event.charAt(0).toUpperCase() + event.substring(1);
    },

    handlePush: function(params, headers) {
        if (params.payload) {
            try {
                this.payloadParser.parse(
                    params.payload,
                    headers[this.knownGithubHeaders.delivery]
                );
            } catch(err) {
                this.log.error({ err: err }, 'An error occurred while parsing the payload');
            }
        }
    }
});

module.exports = GithubEventParser;
