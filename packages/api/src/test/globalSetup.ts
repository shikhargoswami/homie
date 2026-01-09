/**
 * Jest Global Setup
 * Runs ONCE before all test suites
 */

import { pgPool } from '../database/client';
import { redisClient } from '../database/client';

export default async () => {
  console.log('\n🔧 Setting up test environment...\n');
  
  try {
    // Test database connection
    await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
    
    // Connect Redis if not already connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connected');
    }
    
    console.log('\n✅ Test environment ready\n');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
};
