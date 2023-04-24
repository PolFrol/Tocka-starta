const gulp = require("gulp");
const path = require("path");
const fs = require("fs");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const rename = require("gulp-rename");
const htmlmin = require("gulp-htmlmin");
const terser = require("gulp-terser");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const replace = require('gulp-replace-task');
const del = require("del");
const sync = require("browser-sync").create();
const Applause = require('applause');

// Styles

const styles = () => {
  return gulp.src("source/assets/css/*.css")
    .pipe(plumber())
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest("build/assets/css"))
    .pipe(sync.stream());
}
exports.styles = styles;

const stylesSass = () => {
  return gulp.src("source/assets/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/assets/css"))
    .pipe(sync.stream());
}
exports.stylesSass = stylesSass;

const replacerOpts = {
  patterns: [
    {
      match: /@@INC:\((.+)\)/g,
      replacement: (...args) => {
        const [, filePath] = args;
        try {
          const applause = Applause.create(replacerOpts);
          let content = fs.readFileSync(`./source/include/${filePath}`, 'utf8');
          return applause.replace(content).content || content;
        } catch {
          return `<font color="red"><b>Fail import:</b> ${filePath}</font>`;
        }
      }
    },
    {
      match: /<\?= XTZ::getSvgSprite\('(?<spriteName>[a-z\-_]+)'(, ?(?<width>([0-9]+|null)))?(, ?(?<height>([0-9]+|null)))?(, ?'(?<_class>[a-z\-_]+)')?\) \?>/g,
      replacement: (...args) => {
        const groups = args[args.length - 1];
        if (!groups) {
          return '<!-- svg sprites fail 1 -->';
        }

        const SITE_TEMPLATE_PATH = '.';

        try {

          let {
            spriteName,
            width,
            height,
            _class: className,
          } = groups

          width = !width || width === 'null' ? 24 : width;
          height = !height || height === 'null' ? 24 : height;

          let classAttr = className ? 'class="' + className + '" ' : '';
          let widthAttr = width ? 'width="' + width + '" ' : '';
          let heightAttr = height ? 'height="' + height + '" ' : '';

          let content = '<svg ' + classAttr + widthAttr + heightAttr + '>' +
            '<use xlink:href="' + SITE_TEMPLATE_PATH + '/assets/img/sprite.svg#' + spriteName + '"></use>' +
            '</svg>';
          return content;
        } catch (err) {
          return `<!-- svg sprites fail 2 (${err.message}) -->`;
        }
      }
    },
    {
      match: /<\?= ?SITE_TEMPLATE_PATH ?\?>/g,
      replacement: '.'
    },
  ]
};

// HTML

const html = () => {
  return gulp.src("source/*.html")
    .pipe(
      replace(replacerOpts)
    )
    .pipe(htmlmin({ /* collapseWhitespace: true */ }))
    .pipe(gulp.dest("build"));
}

// Scripts

const scripts = async () => {
  return gulp.src("source/assets/js/*.js")
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest("build/assets/js"))
    .pipe(sync.stream());
}
exports.scripts = scripts;

// Images

// const copyImages = () => {
//   return gulp.src("source/assets/img/**/*.{png,jpg,svg}")
//     .pipe(gulp.dest("build/assets/img"))
// }

// exports.copyImages = copyImages;

const optimizeImages = () => {
  return gulp.src("source/assets/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.mozjpeg({ progressive: true }),
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/assets/img"))
}
exports.optimizeImages = optimizeImages;

// WebP

const createWebp = () => {
  return gulp.src("source/assets/img/**/*.{jpg,png}")
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest("build/assets/img"))
}
exports.createWebp = createWebp;

// Sprite

const sprite = () => {
  return gulp.src("source/assets/img/sprites/**/*.svg", { base: 'source/assets/img/sprites' })
    .pipe(rename((file) => {
      const name = file.dirname.split(path.sep);
      name.push(file.basename);
      file.basename = name.join('-');
    }))
    .pipe(imagemin([
      imagemin.svgo()
    ]))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest("build/assets/img"));
}
exports.sprite = sprite;

// Copy

const copy = (done) => {
  gulp.src([
    "source/fonts/*.{woff2,woff}",
    "source/*.ico",
    "source/assets/img/**/*.svg",
    "!source/assets/img/sprites/**/*.svg",
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build"))
  done();
}
exports.copy = copy;

// Clean

const clean = () => del("build");

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "build"
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}
exports.server = server;

// Reload

const reload = (done) => {
  sync.reload();
  done();
}

// Watcher

const watcher = () => {
  gulp.watch("source/*.html", gulp.series(html, reload));
  gulp.watch("source/assets/sass/**/*.scss", gulp.series(stylesSass));
  gulp.watch("source/assets/sass/**/*.css", gulp.series(styles));
  gulp.watch("source/assets/js/*.js", gulp.series(scripts));
  gulp.watch("source/assets/img/**/*", gulp.series(assetsImagesBuild));
  // gulp.watch("source/assets/img/**/*.{png,jpg,svg}", gulp.series(assetsImagesBuild));
}

const assetsImagesBuild = gulp.parallel(
  // copyImages,
  createWebp,
  sprite
);
exports.assetsImagesBuild = assetsImagesBuild;

// Build
const build = gulp.series(
  clean,
  copy,
  // optimizeImages,
  gulp.parallel(
    stylesSass,
    styles,
    html,
    scripts,
    assetsImagesBuild
  ),
);
exports.build = build;

// Default
exports.default = gulp.series(
  build,
  gulp.series(
    server,
    watcher
  )
);
