// Generates a lightweight placeholder body image so the build and the playground
// work before the real 2048x3072 render is dropped in. The placeholder keeps the
// exact 2:3 aspect ratio of the real body, so mask coordinates (which live in the
// SVG viewBox, not in image pixels) stay valid. Replace src/assets/* with the real
// renders before publishing.
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const WIDTH = 512;
const HEIGHT = 768; // 512:768 === 2048:3072 === 2:3
const FILL = [232, 230, 228]; // warm light gray; red `multiply` reads clearly on it

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([length, body, crc]);
}

const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const stride = WIDTH * 3 + 1; // +1 filter byte per scanline
const raw = Buffer.alloc(stride * HEIGHT);
for (let y = 0; y < HEIGHT; y++) {
  const rowStart = y * stride;
  raw[rowStart] = 0; // filter type: none
  for (let x = 0; x < WIDTH; x++) {
    const p = rowStart + 1 + x * 3;
    raw[p] = FILL[0];
    raw[p + 1] = FILL[1];
    raw[p + 2] = FILL[2];
  }
}

const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/01_male_front_white.png');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes, ${WIDTH}x${HEIGHT})`);
