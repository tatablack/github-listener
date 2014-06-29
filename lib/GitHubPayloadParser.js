var _ = require('lodash'),
    Promise = require('bluebird'),    
    request = Promise.promisify(require('request')),
    Hasher = require('./Hasher'),
    MENTION_REGEXP = /(?:[\s])@([A-Za-z0-9]+[A-Za-z0-9-]+)/g,
    DOMAIN_REGEXP = /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i;

var GitHubPayloadParser = function(log, storage, configuration) {
    this.log = log;
    this.storage = storage;
    this.configuration = configuration;
};

function addMentions(commit) {
    var mention;
    
    commit.mentions = [];
    
    while (mention = MENTION_REGEXP.exec(commit.message)) {
        commit.mentions.push(mention[1]);
    }    
}

function addEmailHash(commit) {
    if (commit.author.email) {
        commit.author.emailHash = Hasher.hash(commit.author.email);
    }
    
    if (commit.committer.email) {
        commit.committer.emailHash = Hasher.hash(commit.committer.email);
    }    
}

function addGravatar(commit, configuration) {
    var gitHubDomain = DOMAIN_REGEXP.exec(commit.repository.url);
    
    if (gitHubDomain) {
        var apiUrl = configuration.get('api')[gitHubDomain[1]],
            username = commit.author.username ? commit.author.username : commit.author.name;

        return request(apiUrl + '/users/' + username).spread(function(response, body) {
            commit.author.avatarUrl = JSON.parse(body).avatar_url;
        });
    } else {
        return true;
    }
}

function addRepositoryInformation(commit, repository) {
    commit.repository = {
        name: repository.name,
        url: repository.url
    };
}

function addMetadata(payload, deliveryHeader) {
    payload.id = deliveryHeader;
    payload.unixtimestamp = Date.now();
    payload.lastSeen = payload.unixtimestamp;
}

_.extend(GitHubPayloadParser.prototype, {
    parse: function(rawPayload, deliveryHeader) {
        var payload = JSON.parse(rawPayload);
        
        Promise.all(_.map(payload.commits, function(commit) {
                addMentions(commit);
                addEmailHash(commit);
                addRepositoryInformation(commit, payload.repository);
                return addGravatar(commit, this.configuration);
        }, this)).then(function() {
            addMetadata(payload, deliveryHeader);
            
            this.storage.savePayload(payload);
            
            this.log.info('Received %d commits from %s', payload.commits.length, payload.repository.name);
        }.bind(this)).catch(function(err) {
            this.log.error({err: err}, 'Error while parsing a payload.');
        }.bind(this));
    }
});

module.exports = GitHubPayloadParser;
