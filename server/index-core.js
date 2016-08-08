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
        configDefault = require('./config/config-default.json'),
        configUser = require('./config/config.json'),
    // custom functions
        mergeObjects = function (objA, objB) {
            let objResult = {};

            for (let keyA in objA) {
                objResult[keyA] = objA[keyA];
            }

            for (let keyB in objB) {
                if (typeof objResult[keyB] == 'object'
                    && typeof objB[keyB] == 'object') {
                    objResult[keyB] = mergeObjects(objResult[keyB], objB[keyB])
                } else {
                    objResult[keyB] = objB[keyB];
                }
            }

            return objResult;
        };

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
        config: mergeObjects(configDefault, configUser),
        fnc: {
            // TODO
        }
    };
};