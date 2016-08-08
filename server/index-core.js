'use strict';

module.exports = function () {
    let path = require('path'),
        fs = require('fs'),
        _ = require('lodash'),
        async = require('async'),
        geocoder = require('node-geocoder')({
            provider: 'google'
        }),
    // custom config
        config = require('./config/config.json')
    // custom functions
        ;

    return {
        node: {
            path: path,
            fs: fs
        },
        npm: {
            _: _,
            async: async,
            geocoder: geocoder
        },
        config: config,
        fnc: {
            // TODO
        }
    };
};