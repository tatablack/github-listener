var http = require('http');

var HttpStatusCodes = {};

for (var number in http.STATUS_CODES ) {
    HttpStatusCodes[http.STATUS_CODES[number]] = number
}

module.exports = HttpStatusCodes;
