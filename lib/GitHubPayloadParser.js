var _ = require('lodash'),
    Hasher = require('./Hasher'),
    MentionRegExp = /(?:[\s])@([A-Za-z0-9]+[A-Za-z0-9-]+)/g;

var GitHubPayloadParser = function(log, storage) {
    this.log = log;
    this.storage = storage;
};

function addMentions(commit) {
    var mention;
    
    commit.mentions = [];
    
    while (mention = MentionRegExp.exec(commit.message)) {
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

function addRepositoryInformation(commit, repository) {
    commit.repository = {
        name: repository.name,
        url: repository.url
    }
}

_.extend(GitHubPayloadParser.prototype, {
    parse: function(payload) {
        var payload = JSON.parse(payload);
        
        _.each(payload.commits, function(commit) {
            addMentions(commit);
            addEmailHash(commit);
            addRepositoryInformation(commit, payload.repository);
        }, this);

        this.storage.save(payload);
        
        this.log.info('Received %d commits from %s', payload.commits.length, payload.repository.name);
    }
});

module.exports = GitHubPayloadParser;
