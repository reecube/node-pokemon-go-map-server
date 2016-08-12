var map,
    wildpokemon = {},
    markersLocation = [],
    markersInfo = [];

getMarkerSize = function () {
    var sizeMin = 40,
        sizeMax = 120,
        wSize = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth,
        size = wSize / 10;

    if (size < sizeMin) {
        size = sizeMin;
    } else if (size > sizeMax) {
        size = sizeMax;
    }

    return size;
};

getInfoMarkerSize = function (size) {
    return size / 2;
};

/**
 * Will reset all the markers depending on the given options.
 *
 * @param options object: { map: ..., forceReset: ... }
 * @param callback function: ()
 */
resetMarkers = function (options, callback) {
    if (!options) options = {
        map: null,
        forceReset: false,
        doNotResetPokemon: false,
        doNotResetInfo: false
    };

    if (options.forceReset) {
        // if you do force the reset, the map will be forced too
        options.map = null;
    }

    var idx;

    if (!options.doNotResetPokemon) {
        for (idx in wildpokemon) {
            wildpokemon[idx].marker.setMap(options.map);

            if (options.forceReset) {
                wildpokemon[idx].marker = null;
                wildpokemon[idx] = null;
            }
        }

        if (options.forceReset) {
            wildpokemon = {};
        }
    }

    if (!options.doNotResetInfo) {
        for (idx in markersLocation) {
            markersLocation[idx].setMap(options.map);

            if (options.forceReset) {
                markersLocation[idx] = null;
            }
        }

        for (idx in markersInfo) {
            markersInfo[idx].setMap(options.map);

            if (options.forceReset) {
                markersInfo[idx] = null;
            }
        }

        if (options.forceReset) {
            markersLocation = [];
            markersInfo = [];
        }
    }

    return callback ? callback() : null;
};

initMap = function (config, callback) {
    resetMarkers({
        map: null,
        forceReset: true,
        doNotResetPokemon: false,
        doNotResetInfo: false
    });

    map = new google.maps.Map(document.getElementById('map'), {
        minZoom: 10,
        zoom: config.zoom,
        center: config.location
    });

    var size = getMarkerSize(),
        sizeCurrPos = getInfoMarkerSize(size);

    markersLocation.push(addMapMarker({
        pos: config.location,
        img: '/img/pokeball.png',
        size: sizeCurrPos,
        zIndex: 1
    }));

    return callback(map, markersLocation);
};

/**
 * Will add a marker to the map.
 *
 * @param options object: { pos: ..., img: ..., size: ..., infoWindow: ..., zIndex: ... }
 */
addMapMarker = function (options) {
    options.zIndex = options.zIndex || 0;

    return new google.maps.Marker({
        position: options.pos,
        map: map,
        icon: {
            url: options.img,
            scaledSize: new google.maps.Size(options.size, options.size),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(options.size / 2, options.size / 2)
        },
        zIndex: options.zIndex,
        infoWindow: options.infoWindow
    });
};

loadPokemonMarker = function (location) {
    return httpRequest('GET', '/api?location=' + encodeURIComponent(JSON.stringify(location)), function (status, response) {
        var resObj = JSON.parse(response);

        var size = getMarkerSize(),
            sizeCurrPos = getInfoMarkerSize(size);

        if (!resObj.error) {
            for (var key in resObj.wildpokemon) {
                // will check if the pokemon already is in the wildpokemon array
                if (!wildpokemon.hasOwnProperty(key)) {
                    var tmpPokemon = resObj.wildpokemon[key],
                        getTypesHtml = function (strTypes) {
                            var result = [],
                                types = strTypes.trim().split(' / ');

                            for (var idx in types) {
                                var type = types[idx].trim(),
                                    lcType = type.toLowerCase();

                                result.push('<img src="/img/types/' + lcType + '.gif" alt="' + type + '">');
                            }

                            return result.join('&nbsp');
                        },
                        htmlTypes = getTypesHtml(tmpPokemon.pokedex.type),
                        infoWindow = new google.maps.InfoWindow({
                            content: '<p id="infowindow-content-' + key + '">'
                            + '<strong>' + tmpPokemon.pokedex.name + '</strong> Nr. ' + tmpPokemon.pokedex.num + '<br><br>'
                            + (htmlTypes ? (htmlTypes + '<br><br>') : '')
                            + '<span class="js-ts-till-hidden">Loading...</span><br><br>'
                            + '</p>'
                        });

                    tmpPokemon.marker = addMapMarker({
                        pos: tmpPokemon.location,
                        img: tmpPokemon.pokedex.img,
                        size: size,
                        infoWindow: infoWindow,
                        zIndex: tmpPokemon.rarity || google.maps.Marker.MAX_ZINDEX + 1
                    });

                    google.maps.event.addListener(tmpPokemon.marker, 'click', function () {
                        var cMarker = this;

                        if (cMarker.infoWindow) {
                            cMarker.infoWindow.open(map, cMarker);
                        } else {
                            console.error('Unknown error occured!');
                        }
                    });

                    wildpokemon[key] = tmpPokemon;
                }
            }

            return markersInfo.push(addMapMarker({
                pos: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                img: '/img/ghost.png',
                size: sizeCurrPos
            }));
        } else {
            if (resObj.message) {
                if (resObj.retryLater) {
                    return setTimeout(function () {
                        return loadPokemonMarker(location);
                    }, resObj.retryLater);
                } else {
                    markersInfo.push(addMapMarker({
                        pos: {
                            lat: location.latitude,
                            lng: location.longitude
                        },
                        img: '/img/ghost-red.png',
                        size: sizeCurrPos
                    }));

                    return console.error(status, resObj.message);
                }
            } else {
                return console.error(status, 'No valid location!');
            }
        }
    });
};

intervalUpdatePokemon = setInterval(function () {
    var tsNow = new Date().getTime();

    for (var key in wildpokemon) {
        var wp = wildpokemon[key];

        if (wp.marker) {
            var wpTsHidden = wp.tsNow + wp.tsTillHidden,
                rest = wpTsHidden - tsNow;

            if (rest > 0) {
                var infoWindow = document.getElementById('infowindow-content-' + key);

                if (infoWindow) {
                    var element = infoWindow.querySelector('.js-ts-till-hidden');

                    if (element) {
                        var restSecs = Math.round(rest / 1000),
                            realSecs = restSecs % 60,
                            realMins = (restSecs - realSecs) / 60;

                        element.innerHTML = realMins + 'mins, ' + realSecs + 'secs';
                    }
                }
            } else {
                if (wp.infoWindow) {
                    wp.infoWindow = null;
                }

                if (wp.marker) {
                    wp.marker.setMap(null);
                    wp.marker = null;
                }

                wp = null;
                wildpokemon[key] = null;
                delete wildpokemon[key];
            }
        }
    }
}, 500);