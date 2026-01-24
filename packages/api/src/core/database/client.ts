import { Pool, PoolClient, QueryResult } from 'pg';
import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// POSTGRESQL CONNECTION POOL
// ============================================

/**
 * Why use connection pooling?
 * - Reuses database connections (faster than creating new connection each time)
 * - Limits concurrent connections (prevents overwhelming database)
 * - Automatic reconnection on failure
 * - Better performance under load
 */
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Wait max 2 seconds for connection
  // SSL config for production (AWS RDS, etc.)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Pool error handler
 * Why: Pool can emit errors even without active query (e.g., lost connection)
 */
pgPool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Helper function to execute queries with automatic connection management
 * 
 * @example
 * const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
 * 
 * Why parameterized queries ($1, $2)?
 * - Prevents SQL injection attacks
 * - PostgreSQL can cache query plans (faster execution)
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const result = await pgPool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
};

/**
 * Helper function for transactions
 * 
 * @example
 * await transaction(async (client) => {
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO tenant_profiles ...');
 *   // Both succeed or both rollback
 * });
 * 
 * Why transactions?
 * - ACID guarantees (Atomicity, Consistency, Isolation, Durability)
 * - Example: Creating user + profile must both succeed or both fail
 */
export const transaction = async (
  callback: (client: PoolClient) => Promise<void>
): Promise<void> => {
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ============================================
// REDIS CLIENT
// ============================================

/**
 * Why Redis?
 * - Session storage (JWT tokens, OTP codes)
 * - Caching (frequently accessed data)
 * - Rate limiting (track API calls per user)
 * - Real-time features (pub/sub for chat)
 * - Sub-millisecond latency (100x faster than PostgreSQL)
 */
export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff: 100ms, 200ms, 400ms, ...
      if (retries > 10) {
        console.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

// ============================================
// DATABASE UTILITIES
// ============================================

/**
 * Check if database exists and is accessible
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

/**
 * Get current database stats
 */
export const getDatabaseStats = async () => {
  try {
    const result = await query(`
      SELECT 
        pg_database.datname as database_name,
        pg_size_pretty(pg_database_size(pg_database.datname)) as size
      FROM pg_database
      WHERE pg_database.datname = current_database();
    `);
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
};

/**
 * Close all connections (for graceful shutdown)
 */
export const closeConnections = async () => {
  await pgPool.end();
  await redisClient.quit();
  console.log('✅ All database connections closed');
};

// Alias for convenience
export const pool = pgPool;
