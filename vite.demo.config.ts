import { defineConfig } from 'vite';
import { libraryAlias } from './vite.shared';

// Public showcase/preview, deployed to Vercel. Builds to demo-dist/ (separate
// from the library's dist/). Excluded from the npm package by files: ["dist"].
export default defineConfig({
  root: 'demo',
  base: './',
  resolve: { alias: libraryAlias },
  server: {
    open: false,
    fs: { allow: ['..'] },
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
});
