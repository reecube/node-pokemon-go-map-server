'use strict';

module.exports = function () {
    let path = require('path'),
        fs = require('fs'),
        _ = require('lodash'),
        async = require('async'),
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
            async: async
        },
        config: config,
        fnc: {
            // TODO
        }
    };
};