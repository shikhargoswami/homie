module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    // Map workspace packages to their source files (for tests)
    '^@homie/shared$': '<rootDir>/../shared/src/index.ts',
    // Map path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Transform TypeScript files in workspace packages
  transformIgnorePatterns: [
    'node_modules/(?!@homie)', // Transform @homie packages
  ],
  // Increase timeout for integration tests
  testTimeout: 10000,
};
