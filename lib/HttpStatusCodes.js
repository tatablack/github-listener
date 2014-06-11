var http = require('http');

var HttpStatusCodes = {};

for (var number in http.STATUS_CODES ) {
    HttpStatusCodes[http.STATUS_CODES[number]] = parseInt(number, 10);
}

module.exports = HttpStatusCodes;
