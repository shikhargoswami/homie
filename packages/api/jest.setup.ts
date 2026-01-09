/**
 * Jest Global Setup
 * Runs ONCE before all test suites
 */

import { redisClient } from './src/database/client';
import { pgPool } from './src/database/client';

export default async () => {
  console.log('🔧 Setting up test environment...\n');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  
  try {
    // Test PostgreSQL connection
    await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
    
    // Connect Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('✅ Redis connected\n');
    
    console.log('✅ Test environment ready\n');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
};
