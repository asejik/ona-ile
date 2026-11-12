import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'baba-keke/', 'playwright-report/', 'test-results/', 'docs/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { window: 'readonly', document: 'readonly', performance: 'readonly', console: 'readonly', fetch: 'readonly', requestAnimationFrame: 'readonly', AbortSignal: 'readonly', AbortController: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', Response: 'readonly' },
    },
  },
);
