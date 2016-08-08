'use strict';

module.exports = function (core) {
    return function (req, res) {
        let geoName = false;

        if (req.query && req.query.name) {
            geoName = req.query.name;
        }

        if (geoName) {
            return core.npm.geocoder.geocode(geoName)
                .then(function (result) {
                    if (result) {
                        if (result.length) {
                            return res.status(200).send({
                                error: false,
                                location: result[0]
                            });
                        } else {
                            return res.status(400).send({
                                error: true,
                                message: 'Parameter \'name\' is not valid!'
                            });
                        }
                    } else {
                        return res.status(500).send({
                            error: true,
                            location: result
                        });
                    }
                })
                .catch(function (err) {
                    console.trace(err);

                    return res.status(500).send({
                        error: true,
                        message: 'Unknown'
                    });
                });
        } else {
            return res.status(400).send({
                error: true,
                message: 'Parameter \'name\' missing!'
            });
        }
    };
};