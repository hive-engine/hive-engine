/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:import/recommended',
    '@vue/eslint-config-prettier',
  ],
  env: {
    node: true,
    browser: true,
    'vue/setup-compiler-macros': 1,
  },
  rules: {
    'vue/multi-word-component-names': 0,
    // "prettier/prettier": 0,
    'vue/no-v-html': 0,
    'vue/no-v-text-v-html-on-component': 0,
    'vue/no-reserved-component-names': 0,
    'import/no-unresolved': ['error', { commonjs: true, amd: true }],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js'],
      },
      alias: {
        map: [['@', './src/']],
        extensions: ['.js', '.vue'],
      },
    },
  },
};
