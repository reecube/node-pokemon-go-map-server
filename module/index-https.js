'use strict';

module.exports = function (core, pathKey, pathCert) {
    let https = require('https'),
        key = core.node.fs.readFileSync(pathKey),
        cert = core.node.fs.readFileSync(pathCert),
        https_options = {
            key: key,
            cert: cert
        },
        hostname = core.config.server.hostname || 'localhost',
        port = core.config.server.port || 443;

    return function (app) {
        let server = https.createServer(https_options, app).listen(port, hostname);
        console.log('server listening on https://%s:%s/', hostname, port);
    };
};
