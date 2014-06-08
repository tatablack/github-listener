var _ = require('lodash'),
    r = require('rethinkdb');

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
                            _.each(['payloads', 'users', 'config'], function(tableName) {
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
        this.log.error({err: err}, 'A database error occurred.')
    },
    
    save: function(payload) {
        this.connection.use('github_listener');
        
        r.table('payloads').insert(payload).run(this.connection, function(err, result) {
            if (err) this.handleError(err);
            
            this.log.info('Payload with id %s saved.', result.generated_keys[0]);
        }.bind(this));
    }
});

module.exports = Storage;
