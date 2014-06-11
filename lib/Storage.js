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
                            _.each([
                                   { name: 'payloads', primaryKey: 'id' },
                                   { name: 'users', primaryKey: 'installationId' }
                            ], function(tableData) {
                                r.db(this.databaseName).tableCreate(tableData.name, { primaryKey: tableData.primaryKey}).run(conn, function(err, result) {
                                    if (err) this.handleError(err);

                                    if (result.created) {
                                        this.log.info('Table %s created.', tableData.name);
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
                installationId: params.installationId
            };
        
        if (params.username) {
            user.username = params.username;
        }

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
    
    updateUser: function(params) {
        'use strict';
        this.connection.use('github_listener');

        var deferred = Q.defer(),
            user = {};

        _.each(['installationId', 'username'], function(name) {
            if (params[name]) {
                user[name] = params[name];
            }
        });

        r.table('users').get(user.installationId).replace(user).run(this.connection, function(err, result) {
            if (err) {
                this.handleError(err);
                deferred.reject(new Error(err));
            } else {
                if (result.errors) {
                    this.log.warn('Unable to update the user. The error reported is: %s', result.first_error);
                    deferred.reject(new Error(result.first_error));
                } else {
                    this.log.info('User updated successfully.');
                    deferred.resolve();
                }                
            }
        }.bind(this));
        
        return deferred.promise;        
    },

    getNotificationsFor: function(installationId) {
        this.connection.use('github_listener');
        
        var deferred = Q.defer();
        
        r.table('users').get(installationId).run(this.connection, function(err, user) {
            if (err) {
                deferred.reject(new Error(err));
            } else {
                if (!user) {
                    deferred.resolve({ commits: [] });
                } else {
                    r.table('payloads').concatMap(function(payload) {
                        return payload('commits').filter(function(commit) {
                            return commit('mentions').contains(user.username) &&
                                   commit('lastSeen').lt(user.lastSeen);
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
                    });
                }
            }
        }.bind(this));
        
        return deferred.promise;
    },
    
    updateLastseen: function(installationId) {
        var updateChain = r.table('users').get(installationId).update({ lastSeen: Date.now() }),
            promisedUpdate = Q.nbind(updateChain.run, updateChain);
        
        return promisedUpdate(this.connection);
    }
});

module.exports = Storage;
