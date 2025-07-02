/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|inquirer|ora|execa|@modelcontextprotocol)/)'
  ],
  moduleNameMapper: {
    'inquirer': '<rootDir>/src/__tests__/fixtures/inquirer-mock.ts',
    '^chalk$': '<rootDir>/src/__tests__/fixtures/chalk-mock.ts',
    '^ora$': '<rootDir>/src/__tests__/fixtures/ora-mock.ts',
    '^execa$': '<rootDir>/src/__tests__/fixtures/execa-mock.ts',
    '^fs-extra$': '<rootDir>/src/__tests__/fixtures/fs-extra-mock.ts',
    '^../core/vibecli-core\.js$': '<rootDir>/src/__tests__/fixtures/vibecli-core-mock.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  clearMocks: true,
  restoreMocks: true
};