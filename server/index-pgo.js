'use strict';

module.exports = function (core) {
    let pgoConfig = core.config.pgo,
    // all the accounts-related definitions
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
    // all the other definitions
        pgoApi = require('pokemon-go-node-api'),
        pokedex = require('./data/pokedex.json'),
        getPokemonByNumber = function (number) {
            let result = pokedex.pokemon[0];

            for (let idx in pokedex.pokemon) {
                if (pokedex.pokemon[idx].id == number) {
                    result = pokedex.pokemon[idx];
                }
            }

            return result;
        };

    return function (req, res) {
        let showResult = function (status, result) {
                return res.status(status).send(result);
            },
            handleError = function (acc, err) {
                console.error(`Error on account '${acc.username}':`);
                console.trace(err);
                return showResult(500, {
                    error: true,
                    message: err.message,
                    retryLater: pgoConfig.api.safeTime
                });
            },
            cbReadyForRequest = function (openAccount, pgo) {
                return pgo.Heartbeat(function (err, hb) {
                    if (err) {
                        return handleError(openAccount, err);
                    } else {
                        let wildpokemon = {};

                        for (let i = 0; i < hb.cells.length; i++) {
                            for (let j = 0; j < hb.cells[i].WildPokemon.length; j++) {
                                let tmpPokemon = hb.cells[i].WildPokemon[j],
                                    tmpPokedex = getPokemonByNumber(tmpPokemon.pokemon.PokemonId);

                                wildpokemon[tmpPokemon.EncounterId + ''] = {
                                    location: {
                                        lat: tmpPokemon.Latitude,
                                        lng: tmpPokemon.Longitude
                                    },
                                    spawnPointId: tmpPokemon.SpawnPointId,
                                    tsTillHidden: tmpPokemon.TimeTillHiddenMs,
                                    tsNow: new Date().getTime(),
                                    pokedex: {
                                        num: tmpPokedex.num,
                                        name: tmpPokedex.name,
                                        type: tmpPokedex.type,
                                        img: tmpPokedex.img.replace('http://www.serebii.net/pokemongo', '/img')
                                    }
                                };
                            }
                        }

                        setTimeout(function () {
                            return currAccounts.push(openAccount);
                        }, pgoConfig.api.safeTime);

                        return showResult(200, {
                            error: false,
                            wildpokemon: wildpokemon
                        });
                    }
                });
            };

        try {
            let paramLoc = JSON.parse(req.query.location);

            if (paramLoc && paramLoc.latitude && paramLoc.longitude) {
                let openAccount = currAccounts.shift();

                if (openAccount) {
                    let useCurrentSession = false,
                        tsNow = new Date().getTime();

                    if (typeof openAccount.tsToken == 'number'
                        && openAccount.tsToken > 0
                        && (tsNow - openAccount.tsToken < pgoConfig.api.sessionLifetime)) {
                        useCurrentSession = !!openAccount.currentSession;
                    }

                    if (useCurrentSession) {
                        return openAccount.currentSession.SetLocation({
                            type: 'coords',
                            coords: paramLoc
                        }, function (err) {
                            if (err) {
                                return handleError(openAccount, err);
                            } else {
                                return cbReadyForRequest(openAccount, openAccount.currentSession);
                            }
                        });
                    } else {
                        openAccount.currentSession = new pgoApi.Pokeio();
                        return openAccount.currentSession.init(openAccount.username, openAccount.password, {
                            type: 'coords',
                            coords: paramLoc
                        }, openAccount.provider, function (err) {
                            if (err) {
                                return handleError(openAccount, err);
                            } else {
                                return cbReadyForRequest(openAccount, openAccount.currentSession);
                            }
                        });
                    }
                } else {
                    return showResult(503, {
                        error: true,
                        message: 'No open account available!',
                        retryLater: pgoConfig.api.safeTime
                    });
                }
            } else {
                return showResult(400, {
                    error: true,
                    message: 'Bad request!'
                });
            }
        } catch (ex) {
            return showResult(400, {
                error: true,
                message: 'Bad request!'
            });
        }
    };
};
