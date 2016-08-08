'use strict';

let Core = require('./index-core'),
    core = Core(),
    PGO = require('./index-pgo'),
    Client = require('./index-client'),
    HTTP = require('./index-http'),
    HTTPS = require('./index-https'),
    swig = require('swig'),
    express = require('express'),
    app = express(),
// https
    pathKey = './https-key.pem',
    pathCert = './https-cert.pem';

app.engine('swig', swig.renderFile);

app.set('view engine', 'swig');

app.set('views', __dirname + '/../client/templates');

app.use('/', express.static(__dirname + '/../client/www'));

app.get('/', Client(core));

app.get('/api', PGO(core));

let useHttp = function () {
        let http = HTTP(core);

        // start https server
        http(app);
    },
    useHttps = function () {
        let https = HTTPS(core, pathKey, pathCert);

        // start https server
        https(app);
    };

core.node.fs.lstat(pathKey, function (errKey, statsKey) {
    if (errKey) return useHttp();

    if (statsKey.isFile()) {
        return core.node.fs.lstat(pathCert, function (errCert, statsCert) {
            if (errCert) return useHttp();

            if (statsCert.isFile()) {
                return useHttps();
            } else {
                return useHttp();
            }
        });
    } else {
        return useHttp();
    }
});