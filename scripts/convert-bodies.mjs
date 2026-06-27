// Converts the master body PNGs (assets-src/) into optimized WebP that ships in
// the package (src/assets/bodies/). Run once when masters change:
//   npm run convert:bodies
// Masters stay in the repo for reproducibility but never ship (files: ["dist"]).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'assets-src');
const OUT = join(root, 'src/assets/bodies');

// master PNG -> shipped WebP, named {gender}-{view}-{theme}
const MAP = {
  '01_male_front_white_transparent.png': 'male-front-light.webp',
  '02_male_back_white_transparent.png': 'male-back-light.webp',
  '03_female_front_white_transparent_aligned.png': 'female-front-light.webp',
  '04_female_back_white_transparent_aligned.png': 'female-back-light.webp',
  '05_male_front_dark_transparent_no_light_outline.png': 'male-front-dark.webp',
  '06_male_back_dark_transparent_no_light_outline.png': 'male-back-dark.webp',
  '07_female_front_dark_transparent_no_light_outline_aligned.png': 'female-front-dark.webp',
  '08_female_back_dark_transparent_no_light_outline_aligned.png': 'female-back-dark.webp',
};

mkdirSync(OUT, { recursive: true });

let total = 0;
for (const [src, out] of Object.entries(MAP)) {
  const info = await sharp(join(SRC, src))
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(join(OUT, out));
  total += info.size;
  console.log(`${out.padEnd(26)} ${String(Math.round(info.size / 1024)).padStart(4)} KB  ${info.width}x${info.height}`);
}
console.log(`\ntotal: ${(total / 1024 / 1024).toFixed(2)} MB across ${Object.keys(MAP).length} bodies`);
