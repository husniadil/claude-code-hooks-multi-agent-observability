import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.claude/**',
      'apps/demo-cc-agent/**',
      'apps/client/public/**',
      'apps/server/src/logs/**',
      'apps/client/src/logs/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // Parse <script lang="ts"> inside .vue SFCs with the TypeScript parser.
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },

  // Browser + Node globals cover the Vite client and the Bun server alike.
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },

  {
    rules: {
      // The hook payload / chat data is genuinely dynamic JSON; surface `any`
      // as a warning (visible tech-debt) rather than blocking the build on it.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow intentionally-unused caught errors and `_`-prefixed bindings.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  // Keep eslint-config-prettier last so it disables stylistic rules that Prettier owns.
  configPrettier,
);
