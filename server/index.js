'use strict';

let Core = require('./index-core'),
    core = Core(),
    PGO = require('./index-pgo'),
    HTTP = require('./index-http'),
    HTTPS = require('./index-https'),
    swig = require('swig'),
    express = require('express'),
    app = express(),
// vars
    pathClient = core.node.path.normalize(core.node.path.join(__dirname, '..', 'client')),
    pathPublic = core.node.path.join(pathClient, 'www'),
    pathPublicSrc = core.node.path.join(pathClient, 'www-src'),
    pathTemplates = core.node.path.join(pathPublicSrc, 'templates'),
// https
    pathKey = './https-key.pem',
    pathCert = './https-cert.pem';

app.engine('swig', swig.renderFile);

app.set('view engine', 'swig');

app.set('views', pathTemplates);

app.use('/', express.static(pathPublic));

app.get('/', PGO(core));

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