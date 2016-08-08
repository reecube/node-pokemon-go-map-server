'use strict';

module.exports = function (core) {
    let pgoConfig = core.config.pgo,
        cloneAccounts = function (refAccounts) {
            let result = [];

            for (let idx in refAccounts) {
                result.push({
                    username: refAccounts[idx].username,
                    password: refAccounts[idx].password,
                    provider: refAccounts[idx].provider
                });
            }

            return result;
        },
        addAccounts = function (refAccounts) {
            let result = [];

            for (let idx in refAccounts) {
                result.push(refAccounts[idx]);
            }

            return result;
        },
        accounts = cloneAccounts(pgoConfig.accounts),
        currAccounts = addAccounts(accounts),
        getOpenAccount = function () {
            return currAccounts.pop();
        },
        pgoApi = require('pokemon-go-node-api'),
        pgo,
        pokedex = require('./data/pokedex.json'),
        showError = function (req, res, msg, status) {
            status = status || 500;

            res.status(status).send({
                'error': true,
                'message': msg
            });
        },
        handleError = function (req, res, err) {
            console.error('[!] An error occured!');
            console.trace(err);

            return res.status(500).send(err);
        },
        cbSuccess = function (req, res, jsConfig) {
            res.render('index', {
                title: 'Pokemon GO Map',
                jsConfig: JSON.stringify(jsConfig),
                apiKey: core.config.maps.apikey
            });
        },
        safeCallback = function (req, res, cb) {
            return function (p1, p2, p3, p4, p5, p6) {
                try {
                    cb(p1, p2, p3, p4, p5, p6);
                } catch (ex) {
                    return handleError(req, res, ex);
                }
            };
        },
        getPokemonByNumber = function (pokedexNumber) {
            return pokedex.pokemon[pokedexNumber - 1];
        },
        doAllTheStuff = function (req, res, openAccount) {
            console.log('[i] Current location: ' + pgo.playerInfo.locationName);
            console.log('[i] lat/long/alt: : ' + pgo.playerInfo.latitude + ' ' + pgo.playerInfo.longitude + ' ' + pgo.playerInfo.altitude);

            let cbGetProfile = function (err, profile) {
                if (err) return handleError(req, res, err);

                console.log('[i] Username: ' + profile.username);
                console.log('[i] Team: ' + profile.team);
                console.log('[i] Poke Storage: ' + profile.poke_storage);
                console.log('[i] Item Storage: ' + profile.item_storage);

                let pokecoin = 0,
                    stardust = 0;

                for (let i = 0; i < profile.currency.length; i++) {
                    switch (profile.currency[i].type) {
                        case 'POKECOIN':
                            if (profile.currency[i].amount) {
                                pokecoin = profile.currency[i].amount;
                            }
                            break;
                        case 'STARDUST':
                            if (profile.currency[i].amount) {
                                stardust = profile.currency[i].amount;
                            }
                            break;
                        default:
                            console.warn('[!] Unknown currency:', profile.currency[i].type);
                            break;
                    }
                }

                console.log('[i] Pokecoin: ' + pokecoin);
                console.log('[i] Stardust: ' + stardust);

                let steps = pgoConfig.steps || 1,
                    paramSteps = '';

                if (req.body && req.body.steps) {
                    paramSteps = req.body.steps;
                } else if (req.query && req.query.steps) {
                    paramSteps = req.query.steps;
                }

                if (paramSteps) {
                    try {
                        steps = parseInt(paramSteps);

                        if (steps < 1) {
                            // min
                            steps = 1;
                        } else if (steps > 10) {
                            // max
                            steps = 10;
                        }
                    } catch (err) {
                        return handleError(req, res, err);
                    }
                }

                // FIXME: currently only 1 step allowed
                steps = 3;

                let nearbyPokemon = [],
                    queueLocations = [],
                    pgoLoc = pgo.GetLocationCoords(),
                    cbAllCollected = function (errors) {
                        for (let i = 0; i < errors.length; i++) {
                            console.error('[!]', errors[i]);
                        }

                        // filter duplicated pokemon
                        let realNearbyPokemon = [];
                        for (let npIdx = 0; npIdx < nearbyPokemon.length; npIdx++) {
                            let shouldAdd = true;
                            for (let rnpIdx = 0; rnpIdx < realNearbyPokemon.length; rnpIdx++) {
                                if (realNearbyPokemon[rnpIdx].spawnPointId === nearbyPokemon[npIdx].spawnPointId) {
                                    shouldAdd = false;
                                    break;
                                }
                            }
                            if (shouldAdd) realNearbyPokemon.push(nearbyPokemon[npIdx]);
                        }

                        console.log('[i] Nearby Pokemon: ', realNearbyPokemon.length);

                        setTimeout(function () {
                            currAccounts.push(openAccount);
                        }, 2000);

                        return cbSuccess(req, res, {
                            zoom: 18,
                            location: {
                                lat: pgoLoc.latitude,
                                lng: pgoLoc.longitude
                            },
                            pokemon: realNearbyPokemon
                        });
                    },
                    deltaLat = 0.0008,
                    deltaLng = 0.0010,
                    totLocations = steps * steps,
                    totLocationsStr = totLocations.toString();

                for (var stpLat = -(steps / 2); stpLat < (steps / 2); stpLat++) {
                    for (var stpLng = -(steps / 2); stpLng < (steps / 2); stpLng++) {
                        queueLocations.push({
                            latitude: pgoLoc.latitude + stpLat * deltaLat,
                            longitude: pgoLoc.longitude + stpLng * deltaLng,
                            altitude: pgoLoc.altitude
                        });
                    }
                }

                let crawl = function (errors) {
                    if (queueLocations.length > 0) {
                        let tmpLoc = queueLocations.shift(),
                            currPos = totLocations - queueLocations.length,
                            currPosStr = currPos.toString(),
                            currPercent = Math.round(((currPos - 1) / totLocations) * 100);

                        while (currPosStr.length < totLocationsStr.length) {
                            currPosStr = ' ' + currPosStr;
                        }

                        console.log('[i] Loading in progress, ' + currPosStr + '/' + totLocationsStr + ', ' + currPercent + '%');

                        pgo.SetLocation({
                            type: 'coords',
                            coords: tmpLoc
                        }, safeCallback(req, res, function (errLocation) {
                            if (errLocation) {
                                errors.push(errLocation);

                                return crawl(errors);
                            } else {
                                return pgo.Heartbeat(safeCallback(req, res, function (errHeartbeat, hb) {
                                    if (errHeartbeat) {
                                        errors.push(errHeartbeat);
                                    } else {
                                        for (let i = 0; i < hb.cells.length; i++) {
                                            for (let j = 0; j < hb.cells[i].WildPokemon.length; j++) {
                                                let pokemon = getPokemonByNumber(hb.cells[i].WildPokemon[j].pokemon.PokemonId);

                                                nearbyPokemon.push({
                                                    location: {
                                                        lat: hb.cells[i].WildPokemon[j].Latitude,
                                                        lng: hb.cells[i].WildPokemon[j].Longitude
                                                    },
                                                    spawnPointId: hb.cells[i].WildPokemon[j].SpawnPointId,
                                                    tsTillHidden: hb.cells[i].WildPokemon[j].TimeTillHiddenMs,
                                                    tsNow: new Date().getTime(),
                                                    pokedex: {
                                                        num: pokemon.num,
                                                        name: pokemon.name,
                                                        type: pokemon.type,
                                                        img: pokemon.img.replace('http://www.serebii.net/pokemongo', '/img')
                                                    }
                                                });
                                            }
                                        }
                                    }

                                    setTimeout(function () {
                                        return crawl(errors);
                                    }, 2000);
                                }));
                            }
                        }));
                    } else {
                        return cbAllCollected(errors);
                    }
                };


                crawl([]);
            };

            pgo.GetApiEndpoint(safeCallback(req, res, function (err, api_endpoint) {
                if (err) return handleError(req, res, err);

                if (api_endpoint) {
                    // FIXME: this should already happen in poke.io.js
                    return pgo.GetProfile(safeCallback(req, res, cbGetProfile));
                } else {
                    return showError(req, res, 'RPC Server offline', 503);
                }
            }));
        };

    return function (req, res) {
        let openAccount = getOpenAccount();

        if (openAccount) {
            let newLocation = pgoConfig.location,
                paramLoc = '';

            if (req.body && req.body.location) {
                paramLoc = req.body.location;
            } else if (req.query && req.query.location) {
                paramLoc = req.query.location;
            }

            if (paramLoc) {
                try {
                    newLocation = JSON.parse(paramLoc);
                } catch (err) {
                    return handleError(req, res, err);
                }
            }

            pgo = new pgoApi.Pokeio();
            pgo.init(openAccount.username, openAccount.password, newLocation, openAccount.provider, safeCallback(req, res, function (err) {
                if (err) return handleError(req, res, err);

                return doAllTheStuff(req, res, openAccount);
            }));
        } else {
            return handleError(req, res, {
                'error': true,
                'message': 'There are no open accounts!'
            });
        }
    };
};
