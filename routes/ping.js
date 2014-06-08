var configuration;

// Default ping handler
function handlePing(req, res, next) {
    res.send(200, { version: configuration.get('version')});
    next();
}

var Setup = function(params) {
    configuration = params.configuration;
    params.server.get('/ping', handlePing);
};

module.exports = Setup;
