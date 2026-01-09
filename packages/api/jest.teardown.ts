/**
 * Jest Global Teardown
 * Runs ONCE after all test suites complete
 */

import { redisClient } from './src/database/client';
import { pgPool } from './src/database/client';

export default async () => {
  console.log('\n🧹 Cleaning up test environment...\n');
  
  try {
    // Close Redis connection
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Redis disconnected');
    }
    
    // Close PostgreSQL pool
    await pgPool.end();
    console.log('✅ PostgreSQL disconnected\n');
    
    console.log('✅ Test environment cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};
