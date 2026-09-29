// Preserve the original for larger/DPR > 1 displays; generate smaller candidates.
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  for (const width of [672, 704]) {
    const result = await sharp(path.join(root, 'assets/img/leveling-tools-800.webp'))
      .resize(width).webp({quality: 80, effort: 6})
      .toFile(path.join(root, `assets/img/leveling-tools-${width}.webp`));
    console.log(`${width}px: ${result.size} bytes`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
