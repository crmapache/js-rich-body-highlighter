import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { libraryAlias } from '../vite.shared';

// Mini real-framework apps that consume the published wrappers (aliased to src),
// to e2e-verify React / Vue / Svelte mount, update, and event wiring.
export default defineConfig({
  root: 'e2e',
  plugins: [react(), svelte()],
  resolve: { alias: libraryAlias },
  // Svelte 5 is ESM; pre-bundling it drops the `mount` named export.
  optimizeDeps: { exclude: ['svelte'] },
  server: { port: 5180, fs: { allow: ['..'] } },
});
