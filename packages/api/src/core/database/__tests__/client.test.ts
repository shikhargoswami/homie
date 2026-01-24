import { query, transaction, checkDatabaseConnection } from '../client';
import { cleanDatabase, createTestUser, closeDatabase } from '../../test/db-helper';
import { beforeEach, describe, afterAll, expect, it } from '@jest/globals';

describe('Database Client', () => {
  afterAll(async () => {
    await closeDatabase();
  });
  
  describe('query()', () => {
    beforeEach(async () => {
      await cleanDatabase();
    });
    
    it('should execute SELECT query', async () => {
      const result = await query('SELECT NOW()');
      expect(result.rows.length).toBe(1);
      expect(result.rows[0]).toHaveProperty('now');
    });
    
    it('should execute parameterized query', async () => {
      const user = await createTestUser({ name: 'John Doe' });
      
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );
      
      expect(result.rows[0].name).toBe('John Doe');
    });
    
    it('should handle query errors', async () => {
      await expect(query('SELECT * FROM nonexistent_table')).rejects.toThrow();
    });
  });
  
  describe('transaction()', () => {
    beforeEach(async () => {
      await cleanDatabase();
    });
    
    it('should commit transaction on success', async () => {
      await transaction(async (client) => {
        await client.query(`
          INSERT INTO users (phone, name, role) VALUES ('9876543210', 'Test', 'tenant')
        `);
      });
      
      const result = await query('SELECT * FROM users WHERE phone = $1', ['9876543210']);
      expect(result.rows.length).toBe(1);
    });
    
    it('should rollback transaction on error', async () => {
      try {
        await transaction(async (client) => {
          await client.query(`
            INSERT INTO users (phone, name, role) VALUES ('9876543210', 'Test', 'tenant')
          `);
          
          // Intentional error
          throw new Error('Transaction error');
        });
      } catch (error) {
        // Expected error
      }
      
      const result = await query('SELECT * FROM users WHERE phone = $1', ['9876543210']);
      expect(result.rows.length).toBe(0); // Transaction rolled back
    });
  });
  
  describe('checkDatabaseConnection()', () => {
    it('should return true when connected', async () => {
      const connected = await checkDatabaseConnection();
      expect(connected).toBe(true);
    });
  });
});

