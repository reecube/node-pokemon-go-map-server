(function () {
    var prepareView = function (viewName) {
            var view = document.querySelector('.view[data-view="' + viewName + '"]');

            view.classList.add('preparing');
        },
        loadView = function (viewName) {
            var view = document.querySelector('.view[data-view="' + viewName + '"]'),
                views = document.querySelectorAll('.view');

            for (var i = 0; i < views.length; i++) {
                if (views[i] !== view) {
                    views[i].classList.remove('active');
                    views[i].classList.remove('preparing');
                }
            }

            view.classList.add('active');
            view.classList.remove('preparing');

            document.dispatchEvent(new Event('view-active-changed'));
        },
        loadCoordinates = function () {
            return navigator.geolocation.getCurrentPosition(function (position) {
                if (position && position.coords && typeof position.coords.accuracy == 'number') {
                    if (position.coords.accuracy > 50) {
                        console.warn('The gps signal is too inaccurate with', position.coords.accuracy, 'meters');
                    }

                    document.getElementById('input-location-coords-lat').value = position.coords.latitude;
                    document.getElementById('input-location-coords-lng').value = position.coords.longitude;
                } else {
                    console.warn('Could not get the geolocation for the position:', position);
                }
            }, function error(err) {
                console.warn('geolocation:', err);
            }, {
                // FYI: https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        },
        refreshLocationType = function (val) {
            document.getElementById('main-content-wrapper').setAttribute('data-location-type', val);
        },
        saveToLocalStorage = function (steps, jsonLoc) {
            try {
                if (!!localStorage) {
                    localStorage.setItem('steps', steps);
                    localStorage.setItem('location', jsonLoc);
                }
            } catch (ex) {
                console.trace(ex);
            }
        },
        loadFromLocalStorage = function () {
            try {
                if (!!localStorage) {
                    var steps = localStorage.getItem('steps'),
                        jsonLoc = localStorage.getItem('location');

                    if (steps) {
                        document.getElementById('input-steps').value = steps;
                    }

                    if (jsonLoc) {
                        try {
                            var loc = JSON.parse(jsonLoc);

                            document.getElementById('input-location-type').value = loc.type;
                            document.getElementById('input-location-name').value = loc.name;
                            if (loc.coords) {
                                document.getElementById('input-location-coords-lat').value = loc.coords.latitude;
                                document.getElementById('input-location-coords-lng').value = loc.coords.longitude;
                            }

                            refreshLocationType(loc.type || 'coords');
                        } catch (ex) {
                            console.trace(ex);
                        }
                    }
                }
            } catch (ex) {
                console.trace(ex);
            }
        };

    document.ontouchmove = function (event) {
        event.preventDefault();
    };

    document.addEventListener('view-active-changed', function () {
        var headerLinks = document.querySelectorAll('#header a'),
            i;

        switch (document.querySelector('.view.active').getAttribute('data-view')) {
            case 'map':
                for (i = 0; i < headerLinks.length; i++) {
                    headerLinks[i].classList.add('visible');
                }
                break;
            default:
                for (i = 0; i < headerLinks.length; i++) {
                    headerLinks[i].classList.remove('visible');
                }
                break;
        }
    }, false);

    var links = document.querySelectorAll('.js-view-link');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function (event) {
            event.preventDefault();

            var link = this;

            loadView(link.getAttribute('data-view'));
        }, false);
    }

    var loadPokemonMarkers = function (loc, steps) {
            // TODO: start loading the pokemon markers here

            let deltaLat = 0.0008,
                deltaLng = 0.0010;

            for (var stpLat = -(steps / 2); stpLat < (steps / 2); stpLat++) {
                for (var stpLng = -(steps / 2); stpLng < (steps / 2); stpLng++) {
                    loadPokemonMarker({
                        latitude: loc.lat + stpLat * deltaLat,
                        longitude: loc.lng + stpLng * deltaLng,
                        altitude: loc.alt
                    });
                }
            }
        },
        lastLocation = null,
        lastSteps = null;

    document.querySelector('.js-show-map').addEventListener('click', function (event) {
        event.preventDefault();

        var steps = parseInt(document.getElementById('input-steps').value),
            location = {
                type: document.getElementById('input-location-type').value,
                name: document.getElementById('input-location-name').value,
                coords: {
                    latitude: parseFloat(document.getElementById('input-location-coords-lat').value) || 0,
                    longitude: parseFloat(document.getElementById('input-location-coords-lng').value) || 0
                }
            },
            cbContinue = function (loc) {
                return initMap({
                    zoom: 18,
                    location: loc
                }, function () {
                    lastLocation = loc;
                    lastSteps = steps;

                    loadPokemonMarkers(lastLocation, lastSteps);

                    return loadView('map');
                });
            };

        saveToLocalStorage(steps, JSON.stringify(location));

        prepareView('map');

        if (location.type == 'name' && location.name) {
            return httpRequest('GET', '/geocoder?name=' + encodeURIComponent(location.name), function (status, response) {
                var resObj = JSON.parse(response);

                if (!resObj.error
                    && resObj.location) {
                    return cbContinue({
                        lat: resObj.location.latitude,
                        lng: resObj.location.longitude
                    });
                } else {
                    if (resObj.message) {
                        return console.error(status, resObj.message);
                    } else {
                        return console.error(status, 'No valid location!');
                    }
                }
            });
        }
        else if (location.type == 'coords' && location.coords) {
            return cbContinue({
                lat: location.coords.latitude,
                lng: location.coords.longitude
            });
        } else {
            return console.error('No valid location!');
        }
    }, false);

    document.querySelector('.js-refresh-map').addEventListener('click', function (event) {
        event.preventDefault();

        if (lastLocation && lastSteps) {
            return resetMarkers({
                map: null,
                forceReset: true,
                doNotResetPokemon: false,
                doNotResetInfo: false
            }, function () {
                var size = getMarkerSize(),
                    sizeCurrPos = getInfoMarkerSize(size);

                markersLocation.push(addMapMarker(lastLocation, '/img/pokeball.png', sizeCurrPos));

                loadPokemonMarkers(lastLocation, lastSteps);
            });
        } else {
            console.error('Unknown error occured!');
        }
    }, false);

    document.querySelector('.js-coords-from-gps').addEventListener('click', function (event) {
        event.preventDefault();

        return loadCoordinates();
    }, false);

    document.getElementById('input-location-type').addEventListener('change', function () {
        var select = this;

        return refreshLocationType(select.value);
    }, false);

    // load data from local storage
    loadFromLocalStorage();

    // load coordinates to the inputs
    loadCoordinates();
})();