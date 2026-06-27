import { defineConfig } from 'tsup';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ASSET_SRC = 'src/assets';
const ASSET_OUT = 'dist';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.tsx',
  },
  format: ['esm'],
  target: 'es2021',
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  // React stays a (peer) dependency of the consumer, never bundled in.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  // The default body image is referenced with `new URL('./<file>', import.meta.url)`,
  // which downstream bundlers (Vite/webpack5/Rollup) understand and re-emit. esbuild
  // leaves the string verbatim but does not copy the file, so we copy assets into
  // dist/ next to the chunk that resolves them. Keeps the JS engine light.
  async onSuccess() {
    if (!existsSync(ASSET_SRC)) return;
    mkdirSync(ASSET_OUT, { recursive: true });
    for (const file of readdirSync(ASSET_SRC)) {
      if (file.toLowerCase().endsWith('.png')) {
        cpSync(join(ASSET_SRC, file), join(ASSET_OUT, file));
      }
    }
  },
});
