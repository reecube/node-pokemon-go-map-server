<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <title>{{ title }}</title>
    <link rel="stylesheet" href="/css/app.css">
</head>
<body>
<div id="map"></div>
<script src="/js/app.js"></script>
<script>
    var pgoMapConfig = {{ jsConfig | raw }};
</script>
<script async defer
        src="https://maps.googleapis.com/maps/api/js?key={{ apiKey }}&signed_in=true&callback=initMap"></script>
</body>
</html>