module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      transform: {
        '^.+\\.[tj]sx?$': ['@swc/jest', { jsc: { parser: { syntax: 'typescript', decorators: true }, transform: { legacyDecorator: true, decoratorMetadata: true } } }]
      },
      moduleNameMapper: {
        '^@systeme-sante/models(.*)$': '<rootDir>/libs/models/src$1'
      },
      moduleFileExtensions: ['ts', 'js', 'html'],
      testMatch: ['<rootDir>/apps/api/**/*.spec.[jt]s']
    }
  ]
};
