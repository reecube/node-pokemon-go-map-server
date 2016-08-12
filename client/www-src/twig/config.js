"use strict";

module.exports = function () {
    let _ = require('underscore'),
        views = [
            {
                name: 'main',
                title: 'Dashboard',
                icon: 'dashboard',
                active: true,
                main: true,
                pageMain: 'main',
                pages: []
            }
        ];

    return {
        app: {
            title: 'TITLE'
        },
        panels: {
            left: {
                title: 'Menu',
                views: _.map(views, function (view) {
                    return {
                        href: '#view-' + view.name,
                        icon: 'icon icon-page-' + view.icon,
                        title: view.title,
                        name: view.name
                    };
                })
            }
        },
        templates: [],
        viewMain: 'main',
        views: views
    };
};