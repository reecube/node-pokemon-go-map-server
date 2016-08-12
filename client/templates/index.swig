{% extends '_layout.swig' %}

{% block title %}
    <title>{{ title }}</title>
{% endblock %}

{% block metaExt %}
    <meta name="description" content="{{ title }}">
{% endblock %}

{% block head %}
    <link rel="stylesheet" href="/css/app.css">
{% endblock %}

{% block body %}
    <section id="wrapper">
        <header id="header">
            <p>
                <a href="#" class="js-view-link" data-view="main">back</a>
                <span>{{ title }}</span>
                <a href="#" class="js-refresh-map">refresh</a>
            </p>
        </header>
        <section id="content">
            <div class="view active" data-view="main">
                <div class="view-table">
                    <div class="view-table-cell">
                        <div class="container">
                            <div id="main-content-wrapper" data-location-type="coords">
                                <div class="input-wrapper-steps">
                                    <h2>
                                        <label for="input-steps">
                                            <span>Steps</span>
                                        </label>
                                    </h2>
                                    <select id="input-steps" name="location-type">
                                        <option value="1">1</option>
                                        <option value="2" selected>2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </div>

                                <div class="input-wrapper-location-type">
                                    <h2>
                                        <label for="input-location-type">
                                            <span>Type</span>
                                        </label>
                                    </h2>
                                    <select id="input-location-type" name="location-type">
                                        <option value="coords" selected>Coords</option>
                                        <option value="name">Name</option>
                                    </select>
                                </div>

                                <div class="input-wrapper-location-coords">
                                    <h2>
                                        <span>Coords</span>
                                    </h2>

                                    <a href="#" class="button js-coords-from-gps" data-view="main">
                                        <span>load from gps</span>
                                    </a>

                                    <input id="input-location-coords-lat" name="location-coords-lat" type="number"
                                           placeholder="Latitude">
                                    <input id="input-location-coords-lng" name="location-coords-lng" type="number"
                                           placeholder="Longitude">
                                </div>

                                <div class="input-wrapper-location-name">
                                    <h2>
                                        <label for="input-location-name">
                                            <span>Name</span>
                                        </label>
                                    </h2>
                                    <input id="input-location-name" name="location-name" type="text" placeholder="Name">
                                </div>

                                <div>
                                    <a href="#" class="button js-show-map" data-view="main">
                                        <span>show map</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="view" data-view="map">
                <div id="map">
                </div>
            </div>
        </section>
    </section>
{% endblock %}

{% block footer %}
    <script src="/js/tools.js"></script>
    <script src="/js/map.js"></script>
    <script src="/js/app.js"></script>

    <script async defer
            src="https://maps.googleapis.com/maps/api/js?key={{ apiKey | raw }}&signed_in=true"></script>
{% endblock %}