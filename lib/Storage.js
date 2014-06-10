var _ = require('lodash'),
    r = require('rethinkdb'),
    Q = require('q');

var Storage = function(log) {
    this.databaseName = 'github_listener';
    this.log = log;
};

_.extend(Storage.prototype, {
    init: function() {
        r.connect('localhost', function(err, conn) {
            if (err) this.handleError(err);
            
            this.connection = conn;
            
            r.dbList().run(conn, function(err, dbList) {
                if (err) this.handleError(err);

                if (!_.contains(dbList, this.databaseName)) {
                    r.dbCreate(this.databaseName).run(conn, function(err, result) {
                        if (err) this.handleError(err);

                        if (result.created) {
                            _.each(['payloads', 'users'], function(tableName) {
                                r.db(this.databaseName).tableCreate(tableName).run(conn, function(err, result) {
                                    if (err) this.handleError(err);

                                    if (result.created) {
                                        this.log.info('Table %s created.', tableName);
                                    }
                                }.bind(this));
                            }.bind(this));
                        }
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    },
    
    handleError: function(err) {
        this.log.error({err: err}, 'A database error occurred.');
    },
    
    savePayload: function(payload) {
        this.connection.use('github_listener');
        
        r.table('payloads').insert(payload).run(this.connection, function(err, result) {
            if (err) this.handleError(err);

            if (result.errors) {
                this.log.warn('Unable to save the payload. The error reported is: %s', result.first_error);
            } else {
                this.log.info('Payload saved successfully.');
            }
        }.bind(this));
    },
    
    createUser: function(params) {
        'use strict';
        this.connection.use('github_listener');

        var deferred = Q.defer(),
            user = {
                id: params.installationId
            };

        r.table('users').insert(user).run(this.connection, function(err, result) {
            if (err) {
                this.handleError(err);
                deferred.reject(new Error(err));
            } else {
                if (result.errors) {
                    this.log.warn('Unable to create the user. The error reported is: %s', result.first_error);
                    deferred.reject(new Error(result.first_error));
                } else {
                    this.log.info('User created successfully.');
                    deferred.resolve();
                }                
            }
        }.bind(this));
        
        return deferred.promise;        
    },
    
    getNotificationsFor: function(username) {
        this.connection.use('github_listener');
        
        var deferred = Q.defer();
        
        r.table('payloads').concatMap(function(payload) {
            return payload('commits').filter(function(commit) {
                return commit('mentions').contains(username);
            });
        }).run(this.connection, function(err, cursor) {
            if (err) {
                deferred.reject(new Error(err));
            } else {
                cursor.toArray(function(err, results) {
                    if (err) {
                        deferred.reject(new Error(err));                        
                    } else {
                        deferred.resolve({commits: results});
                    }
                });
            }
        }.bind(this));
        
        return deferred.promise;
    }
});

module.exports = Storage;
