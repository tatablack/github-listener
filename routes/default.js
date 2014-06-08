// Default handler
function handleDefault(req, res, next) {
    res.send(200, 'Github Listener here. Hi, I\'m a WebHook!');
    next();
}

var Setup = function(params) {
    params.server.get('/', handleDefault);    
};

module.exports = Setup;
