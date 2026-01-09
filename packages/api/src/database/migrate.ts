import fs from 'fs';
import path from 'path';
import { pgPool, query } from './client';

/**
 * Simple migration system
 * 
 * Why not use an ORM?
 * - ORMs add complexity and abstractions
 * - Raw SQL gives full control and visibility
 * - Easier to optimize queries
 * - Less magic, more explicit
 */

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Check if migration has been executed
 */
const isMigrationExecuted = async (name: string): Promise<boolean> => {
  const result = await query('SELECT * FROM migrations WHERE name = $1', [name]);
  return (result.rowCount ?? 0) > 0;
};

/**
 * Record migration execution
 */
const recordMigration = async (name: string): Promise<void> => {
  await query('INSERT INTO migrations (name) VALUES ($1)', [name]);
};

/**
 * Execute all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create migrations table if it doesn't exist
    await query(MIGRATIONS_TABLE);
    
    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Check if schema has been executed
    const migrationName = 'initial_schema';
    const executed = await isMigrationExecuted(migrationName);
    
    if (!executed) {
      console.log('📝 Executing initial schema...');
      
      // Execute schema (split by semicolon for multiple statements)
      await query(schema);
      
      // Record migration
      await recordMigration(migrationName);
      
      console.log('✅ Initial schema created successfully');
    } else {
      console.log('✅ Database schema is up to date');
    }
    
    console.log('🎉 All migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Rollback last migration (for development)
 */
export const rollbackMigration = async (): Promise<void> => {
  try {
    console.log('🔄 Rolling back last migration...');
    
    // Get last migration
    const result = await query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rowCount === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const migrationName = result.rows[0].name;
    
    // Drop all tables (destructive!)
    console.warn('⚠️  This will DROP ALL TABLES. Are you sure?');
    
    await query(`
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS analytics_events CASCADE;
      DROP TABLE IF EXISTS auth_sessions CASCADE;
      DROP TABLE IF EXISTS deals CASCADE;
      DROP TABLE IF EXISTS matches CASCADE;
      DROP TABLE IF EXISTS properties CASCADE;
      DROP TABLE IF EXISTS landlord_profiles CASCADE;
      DROP TABLE IF EXISTS tenant_profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at CASCADE;
    `);
    
    // Remove migration record
    await query('DELETE FROM migrations WHERE name = $1', [migrationName]);
    
    console.log('✅ Migration rolled back');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migrations failed:', error);
      process.exit(1);
    });
}
