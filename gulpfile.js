// Load the installed plugins
const { src, dest, series } = require("gulp");
const concat = require("gulp-concat");
const cleanCSS = require("gulp-clean-css");

// Define the name of your consolidated CSS file
const finalCssFileName = "main.min.css";

// 1. CSS Consolidation Task
function mergeAndMinifyCSS() {
  return src([
    // List all your source CSS files here in the order you want them merged.
    // Example: Put global reset/base styles first, then specific component styles.
    "style-index.css",
    "style-about.css",
    "style-ekl.css",
    "style-esl.css",
    "style-mitglied.css",
  ])
    .pipe(concat(finalCssFileName)) // Merge them all into one file named main.min.css
    .pipe(cleanCSS({ level: 2, format: "beautify" })) // Optimize and minify the result, uncomment for maximum compression
    .pipe(dest("dist/css")); // Save the final file to the dist/css folder
}

// 2. Export the task so it can be run from the command line/VS Code
exports.build = series(mergeAndMinifyCSS);

// You can also define a default task
exports.default = exports.build;
