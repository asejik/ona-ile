import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    target: 'es2022',
    // No source maps in the deployed site: the repo is private (P04). Upload them to Sentry later instead.
    sourcemap: false,
    rollupOptions: {
      input: { main: 'index.html', privacy: 'privacy.html' },
    },
    // Three.js alone is ~550 kB before gzip. The real budget is 400 kB gzipped (PROJECT_PLAN §10).
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
