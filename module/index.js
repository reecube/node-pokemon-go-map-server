'use strict';

let Core = require('./index-core'),
    core = Core(),
    PGO = require('./index-pgo'),
    swig = require('swig'),
    express = require('express'),
    app = express();

app.engine('swig', swig.renderFile);

app.set('view engine', 'swig');

app.set('views', __dirname + '/templates');

app.use('/', express.static(__dirname + '/public'));

app.get('/', PGO(core));

app.listen(core.config.server.port, function () {
    console.log('server listening on http://localhost:' + core.config.server.port + '/');
});