import { defineConfig } from 'vite';
import { libraryAlias } from './vite.shared';

// Dev playground: the internal mask-fitting tool.
export default defineConfig({
  root: 'playground',
  resolve: { alias: libraryAlias },
  server: {
    open: false,
    // src/ lives outside the playground root; allow Vite to read it.
    fs: { allow: ['..'] },
  },
});
