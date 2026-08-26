const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    // TypeScript already validates the @/* alias. Expo's flat preset currently
    // wires an import resolver that reports false errors in this npm workspace.
    rules: {
      'import/no-duplicates': 'off',
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
    },
  },
]);
