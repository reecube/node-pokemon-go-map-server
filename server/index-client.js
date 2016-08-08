'use strict';

module.exports = function (core) {
    return function (req, res) {
        return res.status(200).render('index', {
            title: 'Pokemon GO Map',
            apiKey: core.config.maps.apikey
        });
    };
};