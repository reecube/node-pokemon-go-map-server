function initMap() {
    var config = pgoMapConfig || {
                pokemon: []
            },
        map = new google.maps.Map(document.getElementById('map'), {
            minZoom: 12,
            zoom: config.zoom,
            center: config.location
        }),
        sizeMin = 40,
        sizeMax = 120,
        wSize = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth,
        size = wSize / 10;

    if (size < sizeMin) {
        size = sizeMin;
    } else if (size > sizeMax) {
        size = sizeMax;
    }

    var sizeCurrPos = size / 2;
    new google.maps.Marker({
        position: config.location,
        map: map,
        icon: {
            url: '/img/pokeball.png',
            scaledSize: new google.maps.Size(sizeCurrPos, sizeCurrPos),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(sizeCurrPos / 2, sizeCurrPos / 2)
        }
    });

    for (var i = 0; i < config.pokemon.length; i++) {
        var mLoc = config.pokemon[i].location,
            url = 'http://maps.google.com/?ll=' + mLoc.lat + ',' + mLoc.lng,
            pokemon = config.pokemon[i].pokedex,
            tsNow = config.pokemon[i].tsNow,
            tsTillHidden = config.pokemon[i].tsTillHidden,
            marker = new google.maps.Marker({
                url: url,
                position: mLoc,
                map: map,
                icon: {
                    url: pokemon.img,
                    scaledSize: new google.maps.Size(size, size),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(size / 2, size)
                },
                infoWindow: new google.maps.InfoWindow({
                    content: '<div id="content"><p>'
                    + '<strong>' + pokemon.name + '</strong> Nr. ' + pokemon.num + '<br><br>'
                        //+ pokemon.type + '<br><br>'
                    + '<span data-ts-hidden="' + (tsNow + tsTillHidden) + '">Loading...</span><br><br>'
                    + '<a href="' + url + '" target="_blank">Google Maps</a>'
                    + '</p></div>'
                })
            });

        google.maps.event.addListener(marker, 'click', function () {
            var cMarker = this;
            cMarker.infoWindow.open(map, cMarker);
        });
    }

    var updatePokemon = function () {
        var elements = document.querySelectorAll('[data-ts-hidden]');

        for (var i = 0; i < elements.length; i++) {
            var dataTsHidden = elements[i].getAttribute('data-ts-hidden'),
                tsHidden = parseInt(dataTsHidden),
                rest = tsHidden - new Date().getTime(),
                restSecs = Math.round(rest / 1000),
                realSecs = restSecs % 60,
                realMins = (restSecs - realSecs) / 60;

            if (rest > 0) {
                elements[i].innerHTML = realMins + 'mins, ' + realSecs + 'secs';
            } else {
                elements[i].innerHTML = 'Error: ' + restSecs;
            }
        }

        setTimeout(updatePokemon, 500);
    };
    updatePokemon();
}