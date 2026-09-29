// Keep readable CSS sources; preserve their cascade in one blocking stylesheet.
const fs = require('node:fs');
const path = require('node:path');
const CleanCSS = require('clean-css');
const root = path.resolve(__dirname, '..');
const sources = ['style.css', 'experience.css'].map(name => fs.readFileSync(path.join(root, 'assets/css', name), 'utf8'));
const result = new CleanCSS({level: 1, rebase: false}).minify(sources.join('\n'));
if (result.errors.length) throw new Error(result.errors.join('\n'));
fs.writeFileSync(path.join(root, 'assets/css/site.min.css'), result.styles + '\n');
console.log(`CSS: ${Buffer.byteLength(sources.join('\n'))} -> ${Buffer.byteLength(result.styles)} bytes`);
