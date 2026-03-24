const fs = require('fs');
const swcrc = JSON.parse(fs.readFileSync(`${__dirname}/../../.swcrc`, 'utf-8'));

module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', swcrc],
  },
};
