var map,
    markerLocation,
    wildpokemon = {};

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

initMap = function (config, callback) {
    wildpokemon = {};

    map = new google.maps.Map(document.getElementById('map'), {
        minZoom: 10,
        zoom: config.zoom,
        center: config.location
    });

    var size = getMarkerSize(),
        sizeCurrPos = size / 2;

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

    return callback(map, markerLocation);
};

loadPokemonMarker = function (location) {
    return httpRequest('GET', '/api?location=' + encodeURIComponent(JSON.stringify(location)), function (status, response) {
        var resObj = JSON.parse(response);

        if (!resObj.error) {
            var size = getMarkerSize(),
                sizeCurrPos = size / 2;

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

            new google.maps.Marker({
                position: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                map: map,
                icon: {
                    url: '/img/ghost.png',
                    scaledSize: new google.maps.Size(sizeCurrPos, sizeCurrPos),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(sizeCurrPos / 2, sizeCurrPos / 2)
                }
            });
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