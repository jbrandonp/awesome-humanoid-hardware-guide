module.exports = {
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  '*.{json,md,yml,yaml,html,css,scss}': ['prettier --write'],
};
