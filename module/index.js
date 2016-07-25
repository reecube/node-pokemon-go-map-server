'use strict';

let Core = require('./index-core'),
    core = Core(),
    pgo = require('pokemon-go-node-api'),
    pokedex = require('./data/pokedex.json'),
    swig = require('swig'),
    express = require('express'),
    app = express();

app.engine('swig', swig.renderFile);

app.set('view engine', 'swig');

app.set('views', __dirname + '/templates');

app.use('/', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Pokemon GO Map',
        // TODO
        jsConfig: JSON.stringify(false),
        apiKey: core.config.pgo.maps.apikey
    });
});

app.listen(core.config.server.port, function () {
    console.log('server listening on http://localhost:' + core.config.server.port + '/');
});