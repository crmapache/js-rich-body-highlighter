import { defineConfig } from 'tsup';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ASSET_SRC = 'src/assets/bodies';
const ASSET_OUT = 'dist/bodies';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.tsx',
    'vue/index': 'src/vue/index.ts',
    'svelte/index': 'src/svelte/index.ts',
    'web-component/index': 'src/web-component/index.ts',
  },
  format: ['esm'],
  target: 'es2021',
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  // Framework runtimes stay (peer) dependencies of the consumer, never bundled in.
  external: ['react', 'react-dom', 'react/jsx-runtime', 'vue'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  // Body images are referenced with `new URL('./bodies/<file>', import.meta.url)`,
  // which downstream bundlers (Vite/webpack5/Rollup) understand and re-emit. esbuild
  // leaves the string verbatim but does not copy the file, so we copy the bodies
  // into dist/bodies next to the chunk that resolves them. Keeps the JS engine light.
  async onSuccess() {
    if (!existsSync(ASSET_SRC)) return;
    mkdirSync(ASSET_OUT, { recursive: true });
    for (const file of readdirSync(ASSET_SRC)) {
      if (file.toLowerCase().endsWith('.webp')) {
        cpSync(join(ASSET_SRC, file), join(ASSET_OUT, file));
      }
    }
  },
});
