'use strict';

let Core = require('./index-core'),
    core = Core(),
    pgo = require('pokemon-go-node-api'),
    express = require('express'),
    app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
    if (req.body && req.body.length) {
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.listen(core.config.server.port, function () {
    console.log('server listening on http://localhost:' + core.config.server.port + '/');
});