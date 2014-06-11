var RE_CREDENTIALS = /installationId="([a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}?)"/;

var GitHubListenerAuthentication = {
    getCredentials: function(credentials) {
        'use strict';
        
        var result = RE_CREDENTIALS.exec(credentials);
        return result ? result[1] : result;
    }
};

module.exports = GitHubListenerAuthentication;
