var _ = require('lodash'),
    HttpStatusCodes = require('./HttpStatusCodes'),
    MentionRegExp = /(?:[\s])@([A-Za-z0-9]+[A-Za-z0-9-]+)/g;

var GithubEventParser = function(log, storage) {
    this.log = log;
    this.storage = storage;
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
                
                this.storage.save(payload);
                
                _.each(payload.commits, function(commit) {
                    var mention;
                    
                    commit.mentions = [];
                    
                    while (mention = MentionRegExp.exec(commit.message)) {
                        commit.mentions.push(mention[1]);
                    }
                    
                    this.log.info('%s (%d mentions)', commit.message, commit.mentions.length);
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
