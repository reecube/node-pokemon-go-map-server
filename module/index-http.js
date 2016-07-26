'use strict';

module.exports = function (core) {
    let hostname = core.config.server.hostname || 'localhost',
        port = core.config.server.port || 80;

    return function (app) {
        app.listen(port, function () {
            console.log('server listening on http://%s:%s/', hostname, port);
        });
    };
};
