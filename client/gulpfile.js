"use strict";

let gulp = require('gulp'),
    gulpSass = require('gulp-sass'),
    gulpSourcemaps = require('gulp-sourcemaps'),
    gulpIconfont = require('gulp-iconfont'),
    gulpIconfontCss = require('gulp-iconfont-css'),
    gulpTwig = require('gulp-twig'),
    gulpHtmlmin = require('gulp-htmlmin'),
    gulpUglify = require('gulp-uglify'),
    gulpRename = require('gulp-rename'),
    gulpAutoprefixer = require('gulp-autoprefixer'),
// node requires
    nodeDel = require('del'),
    nodePromisedExec = require('promised-exec'),
// custom stuff
    requireUncached = function requireUncached(module) {
        delete require.cache[require.resolve(module)];
        return require(module);
    },
    configHtmlmin = {
        removeComments: true,
        removeTagWhitespace: true,
        processScripts: ['text/template7'],
        collapseWhitespace: true
    };

// ##################################################
// gulp clean
// ##################################################

gulp.task('clean', function () {
    return nodeDel(['www/**/*', '!www/.gitkeep']);
});

// ##################################################
// gulp copy & build subcmds
// ##################################################

gulp.task('build-twig', function () {
    let twigConfig = requireUncached('./www-src/twig/config.js')(),
        dirTwig = 'www-src/twig/',
        twigFiles = [dirTwig + 'app.twig'];

    for (let idxV = 0; idxV < twigConfig.views.length; idxV++) {
        for (let idxP = 0; idxP < twigConfig.views[idxV].pages.length; idxP++) {
            let dirDest = 'views/' + twigConfig.views[idxV].name + '/pages/',
                fileSrc = twigConfig.views[idxV].pages[idxP] + '.twig';

            twigFiles.push(dirTwig + dirDest + fileSrc);
        }
    }

    return gulp
        .src(twigFiles, {base: dirTwig})
        .pipe(gulpTwig({
            data: twigConfig
        }))
        .pipe(gulpHtmlmin(configHtmlmin))
        .pipe(gulpRename(function (file) {
            if (file && file.dirname) {
                file.dirname = file.dirname.replace('/pages', '/');
                file.dirname = file.dirname.replace('views/', 'pages/');
            }
        }))
        .pipe(gulp.dest('www/'));
});

gulp.task('build-fonts', function () {
    return gulp
        .src('www-src/fonts/**/*.*', {base: 'www-src/fonts'})
        .pipe(gulp.dest('www/fonts/'));
});

gulp.task('build-img', function () {
    return gulp
        .src('www-src/img/**/*.*', {base: 'www-src/img'})
        .pipe(gulp.dest('www/img/'));
});

gulp.task('build-js', function () {
    return gulp
        .src('www-src/js/**/*.*', {base: 'www-src/js'})
        .pipe(gulpUglify())
        .pipe(gulpRename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('www/js/'));
});

gulp.task('build-vendor', function () {
    return gulp
        .src('www-src/vendor/**/*.*', {base: 'www-src/vendor'})
        .pipe(gulp.dest('www/vendor/'));
});

gulp.task('build-scss', function () {
    return gulp
        .src('www-src/scss/**/*.scss')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpSass({
            outputStyle: 'compressed'
        }))
        .pipe(gulpSourcemaps.write())
        .pipe(gulpAutoprefixer())
        .pipe(gulpRename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('www/css'));
});

gulp.task('build-icons', function () {
    let fontName = 'icons';

    return gulp.src(['www-src/icons/svg/**/*.svg'])
        .pipe(gulpIconfontCss({
            fontName: fontName,
            path: 'node_modules/gulp-iconfont-css/templates/_icons.css',
            targetPath: 'icons.css',
            fontPath: '',
            cssClass: 'icon'
        }))
        .pipe(gulpIconfont({
            fontName: fontName
        }))
        .pipe(gulp.dest('www/fonts/icons-generated/'));
});

// ##################################################
// gulp cordova
// ##################################################

gulp.task('cordova-prepare', function () {
    return nodePromisedExec('cordova prepare');
});

gulp.task('cordova-serve', function () {
    return nodePromisedExec('cordova serve');
});

// ##################################################
// gulp build & build-save
// ##################################################

gulp.task('build', gulp.series(
    'build-twig',
    'build-fonts',
    'build-img',
    'build-js',
    'build-vendor',
    'build-scss',
    'build-icons'
));

gulp.task('build-save', gulp.series(
    'clean',
    'build'
));

// ##################################################
// gulp watch
// ##################################################

gulp.task('watch', gulp.series(
    'build-save',
    function () {
        // watch for file-changes and run specific task
        gulp.watch(['www-src/twig/**/*.*'], gulp.series('build-twig'));
        gulp.watch(['www-src/fonts/**/*.*'], gulp.series('build-fonts'));
        gulp.watch(['www-src/img/**/*.*'], gulp.series('build-img'));
        gulp.watch(['www-src/js/**/*.*'], gulp.series('build-js'));
        gulp.watch(['www-src/vendor/**/*.*'], gulp.series('build-vendor'));
        gulp.watch(['www-src/scss/**/*.*'], gulp.series('build-scss'));
        gulp.watch(['www-src/icons/**/*.*'], gulp.series('build-icons'));
    }
));

gulp.task('watch-prepare', function () {
    let taskPrepare = 'cordova-prepare';
    // watch for file-changes and run specific task
    gulp.watch(['www-src/twig/**/*.*'], gulp.series('build-twig', taskPrepare));
    gulp.watch(['www-src/fonts/**/*.*'], gulp.series('build-fonts', taskPrepare));
    gulp.watch(['www-src/img/**/*.*'], gulp.series('build-img', taskPrepare));
    gulp.watch(['www-src/js/**/*.*'], gulp.series('build-js', taskPrepare));
    gulp.watch(['www-src/vendor/**/*.*'], gulp.series('build-vendor', taskPrepare));
    gulp.watch(['www-src/scss/**/*.*'], gulp.series('build-scss', taskPrepare));
    gulp.watch(['www-src/icons/**/*.*'], gulp.series('build-icons', taskPrepare));
});

// ##################################################
// gulp serve
// ##################################################

gulp.task('serve', gulp.series(
    'build-save',
    'cordova-prepare',
    gulp.parallel(
        'cordova-serve',
        'watch-prepare'
    )
));

// ##################################################
// gulp default
// ##################################################

gulp.task('default', gulp.series(
    'serve'
));