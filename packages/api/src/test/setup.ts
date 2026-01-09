/**
 * Jest test setup file
 * Runs before all tests
 */

import dotenv from 'dotenv';
import { afterAll, beforeAll, jest } from '@jest/globals';

// Load environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

// Override DATABASE_URL for tests
process.env.DATABASE_URL = 'postgresql://homie:homie123@localhost:5432/homie';

// Increase timeout for integration tests
jest.setTimeout(15000);

// Suppress console output during tests
if (process.env.SUPPRESS_LOGS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Keep errors for debugging
  };
}

// Global test lifecycle hooks
beforeAll(() => {
  console.error('🔧 Setting up test environment...');
});

afterAll(() => {
  console.error('🧹 Cleaning up test environment...');
});
