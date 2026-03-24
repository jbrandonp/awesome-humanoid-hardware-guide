module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts'],
  transform: {
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
>>>>>>> origin/main
  },
};
