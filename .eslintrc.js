module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.base.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    createDefaultProgram: true,
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    '.eslintrc.js',
    'lint-staged.config.js',
    '*.js',
    'dist',
    'node_modules',
    'coverage',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
  },
  overrides: [
    {
      files: ['apps/api/**/*.ts', 'apps/api/**/*.tsx'],
      env: {
        node: true,
        jest: true,
      },
    },
    {
      files: ['apps/mobile/**/*.ts', 'apps/mobile/**/*.tsx'],

      plugins: ['react', 'react-native'],
      extends: ['plugin:react/recommended'],
      rules: {
        'react-native/no-unused-styles': 'warn',
        'react-native/split-platform-components': 'warn',
        'react-native/no-inline-styles': 'warn',
        'react-native/no-color-literals': 'warn',
        'react-native/no-raw-text': 'warn',
      },
    },
    {
      files: ['apps/desktop/**/*.ts', 'apps/desktop/**/*.tsx'],
      env: {
        browser: true,
        es2021: true,
      },
      plugins: ['react'],
      extends: ['plugin:react/recommended'],
    },
  ],
};
