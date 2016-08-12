httpRequest = function (method, url, callback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
            return callback(xmlhttp.status, xmlhttp.response);
        }
    };

    xmlhttp.open(method, url, true);
    xmlhttp.send();
};