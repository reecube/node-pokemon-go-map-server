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

    markersLocation.push(addMapMarker(config.location, '/img/pokeball.png', sizeCurrPos));

    return callback(map, markersLocation);
};

addMapMarker = function (pos, img, size, infoWindow) {
    return new google.maps.Marker({
        position: pos,
        map: map,
        icon: {
            url: img,
            scaledSize: new google.maps.Size(size, size),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(size / 2, size / 2)
        },
        infoWindow: infoWindow
    });
};

loadPokemonMarker = function (location) {
    return httpRequest('GET', '/api?location=' + encodeURIComponent(JSON.stringify(location)), function (status, response) {
        var resObj = JSON.parse(response);

        var size = getMarkerSize(),
            sizeCurrPos = getInfoMarkerSize(size);

        if (!resObj.error) {
            for (var key in resObj.wildpokemon) {
                var tmpPokemon = resObj.wildpokemon[key],
                    infoWindow = new google.maps.InfoWindow({
                        content: '<p id="infowindow-content-' + key + '">'
                        + '<strong>' + tmpPokemon.pokedex.name + '</strong> Nr. ' + tmpPokemon.pokedex.num + '<br><br>'
                            //+ pokemon.type + '<br><br>'
                        + '<span data-ts-hidden="' + (tmpPokemon.tsNow + tmpPokemon.tsTillHidden) + '">Loading...</span><br><br>'
                        + '</p>'
                    });

                tmpPokemon.marker = addMapMarker(tmpPokemon.location, tmpPokemon.pokedex.img, size, infoWindow);

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

            return markersInfo.push(addMapMarker({
                lat: location.latitude,
                lng: location.longitude
            }, '/img/ghost.png', sizeCurrPos));
        } else {
            if (resObj.message) {
                if (resObj.retryLater) {
                    return setTimeout(function () {
                        return loadPokemonMarker(location);
                    }, resObj.retryLater);
                } else {
                    markersInfo.push(addMapMarker({
                        lat: location.latitude,
                        lng: location.longitude
                    }, '/img/ghost.png-red', sizeCurrPos));

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

            if (wildpokemon[key].tsTillHidden > 0) {
                if (rest > 0) {
                    element.innerHTML = realMins + 'mins, ' + realSecs + 'secs';
                } else {
                    // FIXME: not working as it should
                    // FIXME: delete here is dangerous, do not use it please!
                    console.warn('onUpdatePokemon', wildpokemon[key], rest);

                    wildpokemon[key].marker.setMap(null);

                    delete wildpokemon[key];
                }
            } else {
                var msgError = 'Error';

                if (element.innerHTML != msgError) {
                    console.warn('onUpdatePokemon', wildpokemon[key], dataTsHidden);
                }

                element.innerHTML = msgError;
            }
        }
    }
}, 500);