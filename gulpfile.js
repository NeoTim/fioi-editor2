var http = require("http");
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");

var gulp = require("gulp");

var chmod = require("gulp-chmod");
var concat = require("gulp-concat");
var eol = require("gulp-eol");
var gutil = require("gulp-util");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var wrap = require('gulp-wrap-amd');
var browserify = require('browserify');
var watchify = require('watchify');
var cssify = require('cssify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var assign = require('lodash.assign');
var js_escape = require('js-string-escape');
var jade = require('jade');
var browserifyThrough = require('browserify-through');

var firstBuild = true;

function buildScript (options) {
    var browserifyOpts = {
        entries: [options.entry],
        debug: true,
        transform: [staticJadeify(), cssify]
    };
    if (options.watch)
        browserifyOpts = assign({}, watchify.args, browserifyOpts);
    var bundler = browserify(browserifyOpts);
    if (options.watch)
        bundler = watchify(bundler);

    function rebundle () {
        var p = bundler.bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source(options.output))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}));
        if (options.uglify)
            p = p.pipe(uglify());
        return p
            .pipe(sourcemaps.write("."))
            .pipe(chmod(644))
            .pipe(eol("\n"))
            .pipe(gulp.dest("dist"));
    }

    bundler.on('log', gutil.log);
    bundler.on('update', rebundle);
    return rebundle();
}

function staticJadeify () {
    return browserifyThrough({
      filter: function(fp) {
        return /\.jade$/.test(fp);
      },
      map: function(fp, opts, data, done) {
        return jade.render(data, {
          filename: fp
        }, function(err, html) {
          return done(err, "module.exports = \"" + (js_escape(html)) + "\";\n");
        });
      }
    });
}

function watched(opts) {
    return assign({}, opts, {watch: true});
}

function uglified(opts) {
    var output = opts.output.replace(/.js$/, '.min.js');
    return assign({}, opts, {uglify: true, output: output});
}

var mainScriptOpts = {
    entry: 'src/main.js',
    output: 'fioi-editor2.js',
    watch: false,
    uglify: false
};
var workerScriptOpts = {
    entry: 'src/audio-worker.js',
    output: 'audio-worker.js',
    watch: false,
    uglify: false
};

gulp.task('build', [], function () {
    buildScript(mainScriptOpts);
    buildScript(workerScriptOpts);
});

gulp.task('build_min', [], function () {
    buildScript(uglified(mainScriptOpts))
    buildScript(uglified(workerScriptOpts))
});

gulp.task('watch', [], function () {
    buildScript(watched(mainScriptOpts));
    buildScript(watched(workerScriptOpts));
});

gulp.task('default', ['build', 'build_min']);