// Include gulp
var gulp = require('gulp');

// Include Our Plugin
var sass = require('gulp-sass');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var plumber = require('gulp-plumber');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var haml = require('gulp-haml');
var connect = require('gulp-connect');
var gcmq = require('gulp-group-css-media-queries');
var beep = require('beepbeep');
var fileinclude = require('gulp-file-include');


var onError = function (err) {  
  beep(1);
  console.log(err);
};


gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    livereload: true
  });
});

gulp.task('include', function () {
  gulp.src(['src/html/*.html', 'src/html/partials/*.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }));
    gulp.src('src/html/*.html')
        .pipe(fileinclude({
          prefix: '@@',
          basepath: '@file'
        }))
        .pipe(connect.reload())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('copyImage', function() {
    return gulp.src('src/images/**/*.*')
    .pipe(gulp.dest('./dist/images/'))
});

// Compile Our Sass
gulp.task('sass', function() {
    return gulp.src('src/scss/all.scss')
        .pipe(sass())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('style', function () {
		var plugins = [
        autoprefixer({browsers: ['last 2 version']})
    ];

    return gulp.src('src/scss/all.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(plumber({
        	errorHandler: beep(1)
        }))
        .pipe(postcss(plugins))
        .pipe(gcmq())
        .pipe(cssnano())
        .pipe(connect.reload())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./dist/css'))
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('src/js/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(connect.reload())
        .pipe(gulp.dest('./dist/js'));
});

// Watch Files For Changes
gulp.task('watch', function() {
	gulp.watch(['src/html/*.html', 'src/html/*/*.html'], ['include']);
    gulp.watch('src/js/*.js', ['scripts']);
    gulp.watch(['src/scss/partials/*.scss', 'src/scss/all.scss'], ['style']);
    gulp.watch('src/images/*', ['copyImage']);
});

// Default Task
gulp.task('default', ['connect', 'include', 'style', 'scripts', 'copyImage', 'watch']);