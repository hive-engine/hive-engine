/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', '@vue/eslint-config-prettier'],
  env: {
    node: true,
    'vue/setup-compiler-macros': 1,
  },
  rules: {
    'vue/multi-word-component-names': 0,
    // "prettier/prettier": 0,
    'vue/no-v-html': 0,
    'vue/no-v-text-v-html-on-component': 0,
    'vue/no-reserved-component-names': 0,
  },
};
