// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'frontend/**',
      'e2e_simulations/**',
      'native_build/**',
      'android/**',
      'ios/**',
    ],
  },
  {
    rules: {
      // the canonical way to augment styled-components' DefaultTheme
      '@typescript-eslint/no-empty-object-type': [
        'warn',
        { allowInterfaces: 'with-single-extends' },
      ],
    },
  },
]);
