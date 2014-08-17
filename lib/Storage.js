'use strict';

var _ = require('lodash'),
    r = require('rethinkdb'),
    Promise = require('bluebird');

var TABLES = [
        { name: 'commits', primaryKey: 'id' },
        { name: 'users', primaryKey: 'installationId' }
    ],

    DB_NAME = 'github_listener',
    DB_HOST = 'localhost',
    DB_OPTIONS = { host: DB_HOST},
    DB_OPTIONS_EXTENDED = { host: DB_HOST, db: DB_NAME};

var Storage = function(log) {
    this.log = log;
};
_.extend(Storage.prototype, {
    init: function() {
        var log = this.log,
            connection;

        this.getConnection().then(function(conn) {
            connection = conn;
            return r.dbList().run(connection);
        }).then(function(dbList) {
            if (!_.contains(dbList, DB_NAME)) {
                return r.dbCreate(DB_NAME).run(connection).then(function(result) {
                    return result.created;
                }).then(function() {
                    return Promise.all(
                        _.map(TABLES, function(tableData) {
                            return r.db(DB_NAME).tableCreate(
                                tableData.name,
                                { primaryKey: tableData.primaryKey}
                            ).run(connection);
                        })
                    );
                }).then(function(results) {
                    return _.each(results, function(result, index) {
                        log.info('Table %s was%s created', TABLES[index].name, result.created ? '' : ' not');
                    });
                }).catch(function(err) {
                    log.error({err: err}, 'A database error occurred.');
                });
            } else {
                log.info('Database present');
                return true;
            }
        }).catch(function(err) {
            log.error({err: err}, 'A database error occurred.');
        }).finally(function() {
            this.closeConnection(connection);
        }.bind(this));
    },

    getConnection: function(options) {
        this.log.debug('Trying to get a new database connection');
        return r.connect(options || DB_OPTIONS);
    },

    closeConnection: function(connection) {
        if (connection) {
            this.log.debug('Closing database connection');
            connection.close().error(function(err) {
                this.log.error({err: err}, 'A database error occurred.');
            });
        }
    },

    handleError: function(err) {
        this.log.error({err: err}, 'A database error occurred.');
    },

    saveCommits: function(commits) {
        var log = this.log,
            connection;

        return this.getConnection(DB_OPTIONS_EXTENDED).then(function(conn) {
            connection = conn;
            return r.table('commits').insert(commits).run(connection);
        }).then(function(result) {
            if (result.errors) {
                log.warn('Unable to save the requested commits. The error reported is: %s', result.first_error);
                return false;
            } else {
                log.info('Commits saved successfully.');
                return true;
            }
        }).catch(function(err) {
            log.error({err: err}, 'A database error occurred.');
        }).finally(function() {
            this.closeConnection(connection);
        }.bind(this));
    },

    createUser: function(params) {
        var log = this.log,
            connection,
            user = {
                installationId: params.installationId,
                username: params.username
            };

        return this.getConnection(DB_OPTIONS_EXTENDED).then(function(conn) {
            connection = conn;
            return r.table('users').insert(user).run(connection);
        }).then(function(result) {
            if (result.errors) {
                log.warn('Unable to create the user. The error reported is: %s', result.first_error);
                throw new Error(result.first_error);
            } else {
                log.info('User created successfully.');
                return user;
            }
        }).catch(function(err) {
            log.error({err: err}, 'A database error occurred.');
        }).finally(function() {
            this.closeConnection(connection);
        }.bind(this));
    },

    updateUser: function(params) {
        var log = this.log,
            connection,
            user = {};

        _.each(['installationId', 'username', 'authors'], function(name) {
            if (params[name]) {
                user[name] = params[name];
            }
        });

        return this.getConnection(DB_OPTIONS_EXTENDED).then(function(conn) {
            connection = conn;
            return r.table('users').get(user.installationId).update(user).run(connection);
        }).then(function(result) {
            if (result.errors) {
                log.warn('Unable to update the user. The error reported is: %s', result.first_error);
                throw new Error(result.first_error);
            } else {
                log.info('User updated successfully.');
                return user;
            }
        }).catch(function(err) {
            log.error({err: err}, 'A database error occurred.');
        }).finally(function() {
            this.closeConnection(connection);
        }.bind(this));
    },

    getNotificationsFor: function(installationId) {
        var log = this.log,
            connection;

        return this.getConnection(DB_OPTIONS_EXTENDED).then(function(conn) {
            connection = conn;
            return r.table('commits').filter(function(commit) {
                var user = r.table('users').get(installationId);

                return commit('mentions').contains(user('username')).or(
                    user('authors').contains(function(author) {
                        return commit('author')('name').eq(author) || commit('author')('username').eq(author);
                    })).and(commit('updated').gt(user('lastSeen')));
            }).run(connection);
        }).then(function(cursor) {
            return cursor.toArray();
        }).then(function(results) {
            return { commits: results };
        }).catch(function(err) {
            log.error({err: err}, 'A database error occurred.');
        }).finally(function() {
            this.closeConnection(connection);
        }.bind(this));
    },

    updateLastseen: function(installationId) {
        var log = this.log,
            connection;

        return this.getConnection(DB_OPTIONS_EXTENDED).then(function(conn) {
            connection = conn;
            return r.table('users').get(installationId).update({ lastSeen: Date.now() }).run(connection);
        }).catch(function(err) {
            log.error({err: err}, 'A database error occurred.');
        }).finally(function() {
            this.closeConnection(connection);
        }.bind(this));
    }
});

module.exports = Storage;
