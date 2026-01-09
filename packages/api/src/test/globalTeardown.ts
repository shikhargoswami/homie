/**
 * Jest Global Teardown
 * Runs ONCE after all test suites complete
 */

import { pgPool } from '../database/client';
import { redisClient } from '../database/client';

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
    console.log('✅ PostgreSQL disconnected');
    
    console.log('\n✅ Test environment cleaned up\n');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw - we're exiting anyway
  }
};
