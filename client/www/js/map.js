var map,
    markerLocation,
    wildpokemon = {};

initMap = function (config, callback) {
    wildpokemon = {};

    map = new google.maps.Map(document.getElementById('map'), {
        minZoom: 10,
        zoom: config.zoom,
        center: config.location
    });

    var sizeMin = 40,
        sizeMax = 120,
        wSize = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth,
        size = wSize / 10;

    if (size < sizeMin) {
        size = sizeMin;
    } else if (size > sizeMax) {
        size = sizeMax;
    }

    var sizeCurrPos = size / 2;

    if (config && config.showGhost) {
        // FIXME: this is just for dev-uses, remove it later
        (function () {
            if (config.location && config.location.lat && config.location.lng) {
                // shows the scan-ghosts
                var deltaLat = 0.0012, // y
                    deltaLng = 0.0016,
                    steps = 10;

                for (var stpLat = -Math.floor(steps / 2); stpLat < Math.floor(steps / 2); stpLat++) {
                    for (var stpLng = -Math.floor(steps / 2); stpLng < Math.floor(steps / 2); stpLng++) {
                        if (!(stpLat == 0 && stpLng == 0)) {
                            new google.maps.Marker({
                                position: {
                                    lat: config.location.lat + (stpLat * deltaLat),
                                    lng: config.location.lng + (stpLng * deltaLng)
                                },
                                map: map,
                                icon: {
                                    url: '/img/ghost.png',
                                    scaledSize: new google.maps.Size(sizeCurrPos, sizeCurrPos),
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(sizeCurrPos / 2, sizeCurrPos / 2)
                                }
                            });
                        }
                    }
                }
            }
        })();
    }

    markerLocation = new google.maps.Marker({
        position: config.location,
        map: map,
        icon: {
            url: '/img/pokeball.png',
            scaledSize: new google.maps.Size(sizeCurrPos, sizeCurrPos),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(sizeCurrPos / 2, sizeCurrPos / 2)
        }
    });

    //for (var i = 0; i < config.pokemon.length; i++) {
    //    var mLoc = config.pokemon[i].location,
    //        url = 'http://maps.google.com/?ll=' + mLoc.lat + ',' + mLoc.lng,
    //        pokemon = config.pokemon[i].pokedex,
    //        tsNow = config.pokemon[i].tsNow,
    //        tsTillHidden = config.pokemon[i].tsTillHidden,
    //        marker = new google.maps.Marker({
    //            url: url,
    //            position: mLoc,
    //            map: map,
    //            icon: {
    //                url: pokemon.img,
    //                scaledSize: new google.maps.Size(size, size),
    //                origin: new google.maps.Point(0, 0),
    //                anchor: new google.maps.Point(size / 2, size)
    //            },
    //            infoWindow: new google.maps.InfoWindow({
    //                content: '<div id="content"><p>'
    //                + '<strong>' + pokemon.name + '</strong> Nr. ' + pokemon.num + '<br><br>'
    //                    //+ pokemon.type + '<br><br>'
    //                + '<span data-ts-hidden="' + (tsNow + tsTillHidden) + '">Loading...</span><br><br>'
    //                + '<a href="' + url + '" target="_blank">Google Maps</a>'
    //                + '</p></div>'
    //            })
    //        });
    //
    //    google.maps.event.addListener(marker, 'click', function () {
    //        var cMarker = this;
    //        cMarker.infoWindow.open(map, cMarker);
    //    });
    //}

    //var updatePokemon = function () {
    //    var elements = document.querySelectorAll('[data-ts-hidden]');
    //
    //    for (var i = 0; i < elements.length; i++) {
    //        var dataTsHidden = elements[i].getAttribute('data-ts-hidden'),
    //            tsHidden = parseInt(dataTsHidden),
    //            rest = tsHidden - new Date().getTime(),
    //            restSecs = Math.round(rest / 1000),
    //            realSecs = restSecs % 60,
    //            realMins = (restSecs - realSecs) / 60;
    //
    //        if (rest > 0) {
    //            elements[i].innerHTML = realMins + 'mins, ' + realSecs + 'secs';
    //        } else {
    //            elements[i].innerHTML = 'Error: ' + restSecs;
    //        }
    //    }
    //
    //    setTimeout(updatePokemon, 500);
    //};
    //updatePokemon();

    return callback(map, markerLocation);
};

loadPokemonMarker = function (location) {
    return httpRequest('GET', '/api?location=' + encodeURIComponent(JSON.stringify(location)), function (status, response) {
        var resObj = JSON.parse(response);

        if (!resObj.error) {
            var sizeMin = 40,
                sizeMax = 120,
                wSize = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth,
                size = wSize / 10;

            if (size < sizeMin) {
                size = sizeMin;
            } else if (size > sizeMax) {
                size = sizeMax;
            }

            for (var key in resObj.wildpokemon) {
                var tmpPokemon = resObj.wildpokemon[key];

                tmpPokemon.marker = new google.maps.Marker({
                    position: tmpPokemon.location,
                    map: map,
                    icon: {
                        url: tmpPokemon.pokedex.img,
                        scaledSize: new google.maps.Size(size, size),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(size / 2, size)
                    },
                    infoWindow: new google.maps.InfoWindow({
                        content: '<p id="infowindow-content-' + key + '">'
                        + '<strong>' + tmpPokemon.pokedex.name + '</strong> Nr. ' + tmpPokemon.pokedex.num + '<br><br>'
                            //+ pokemon.type + '<br><br>'
                        + '<span data-ts-hidden="' + (tmpPokemon.tsNow + tmpPokemon.tsTillHidden) + '">Loading...</span><br><br>'
                        + '</p>'
                    })
                });

                google.maps.event.addListener(tmpPokemon.marker, 'click', function () {
                    var cMarker = this;
                    cMarker.infoWindow.open(map, cMarker);
                });

                wildpokemon[key] = tmpPokemon;
            }
        } else {
            if (resObj.message) {
                if (resObj.shouldRetryLater) {
                    return setTimeout(function () {
                        return loadPokemonMarker(location);
                        // FIXME: this interval should be loaded from config
                    }, 5000);
                } else {
                    return console.error(status, resObj.message);
                }
            } else {
                return console.error(status, 'No valid location!');
            }
        }
    });
};

intervalUpdatePokemon = setInterval(function () {
    for (var key in wildpokemon) {
        var infoWindow = document.getElementById('infowindow-content-' + key);

        if (infoWindow) {
            var element = infoWindow.querySelector('[data-ts-hidden]'),
                dataTsHidden = element.getAttribute('data-ts-hidden'),
                tsHidden = parseInt(dataTsHidden),
                rest = tsHidden - new Date().getTime(),
                restSecs = Math.round(rest / 1000),
                realSecs = restSecs % 60,
                realMins = (restSecs - realSecs) / 60;

            if (rest > 0) {
                element.innerHTML = realMins + 'mins, ' + realSecs + 'secs';
            } else {
                console.warn('onUpdatePokemon', wildpokemon[key], rest);

                wildpokemon[key].marker.setMap(null);

                delete wildpokemon[key];
            }
        }
    }
}, 500);