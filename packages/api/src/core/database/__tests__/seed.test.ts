import { query } from '../client';

/**
 * Tests to verify seed data is complete and consistent
 */

describe('Seed Data Verification', () => {
  describe('Users', () => {
    it('should have 5 full home tenants', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'tenant' AND phone LIKE '987654000%'
      `);
      expect(parseInt(result.rows[0].count)).toBe(5);
    });

    it('should have 5 room sharing tenants', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'tenant' AND phone IN ('9876540006', '9876540007', '9876540008', '9876540009', '9876540010')
      `);
      expect(parseInt(result.rows[0].count)).toBe(5);
    });

    it('should have 5 landlords', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'landlord'
      `);
      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(5);
    });

    it('should have test user (9999999999)', async () => {
      const result = await query(`
        SELECT * FROM users WHERE phone = '9999999999'
      `);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].profile_completed).toBe(false);
    });
  });

  describe('Tenant Profiles', () => {
    it('should have full home tenant profiles with preferences', async () => {
      const result = await query(`
        SELECT tp.*, u.phone
        FROM tenant_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.search_type = 'full_home'
      `);
      expect(result.rows.length).toBeGreaterThanOrEqual(5);
      
      // Check preferences are valid JSON
      for (const profile of result.rows) {
        expect(profile.preferences).toBeDefined();
        expect(typeof profile.preferences).toBe('object');
      }
    });

    it('should have room sharing tenant profiles', async () => {
      const result = await query(`
        SELECT tp.*, u.phone
        FROM tenant_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.search_type = 'room_sharing'
      `);
      expect(result.rows.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid budget ranges', async () => {
      const result = await query(`
        SELECT * FROM tenant_profiles
        WHERE budget_min > budget_max
      `);
      expect(result.rows.length).toBe(0);
    });
  });

  describe('Landlord Profiles', () => {
    it('should have landlord profiles with ratings', async () => {
      const result = await query(`
        SELECT lp.*, u.name
        FROM landlord_profiles lp
        JOIN users u ON lp.user_id = u.id
      `);
      expect(result.rows.length).toBeGreaterThanOrEqual(5);
      
      for (const profile of result.rows) {
        expect(profile.rating).toBeGreaterThanOrEqual(0);
        expect(profile.rating).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Properties', () => {
    it('should have properties for full home search', async () => {
      const result = await query(`
        SELECT * FROM properties
        WHERE property_type IN ('apartment', 'villa', 'house')
      `);
      expect(result.rows.length).toBeGreaterThanOrEqual(5);
    });

    it('should have properties for room sharing (PG)', async () => {
      const result = await query(`
        SELECT * FROM properties
        WHERE property_type = 'pg'
      `);
      expect(result.rows.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid rent and deposit', async () => {
      const result = await query(`
        SELECT * FROM properties
        WHERE rent <= 0 OR security_deposit <= 0
      `);
      expect(result.rows.length).toBe(0);
    });

    it('should have amenities as array', async () => {
      const result = await query(`
        SELECT * FROM properties
        WHERE amenities IS NOT NULL
      `);
      
      for (const property of result.rows) {
        expect(Array.isArray(property.amenities)).toBe(true);
      }
    });
  });

  describe('Matches', () => {
    it('should have matches for tenants', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM matches
      `);
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should have valid match scores (0-100)', async () => {
      const result = await query(`
        SELECT * FROM matches
        WHERE match_score < 0 OR match_score > 100
      `);
      expect(result.rows.length).toBe(0);
    });
  });

  describe('Conversations', () => {
    it('should have active conversations', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM conversations
        WHERE status = 'active'
      `);
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });
  });

  describe('Messages', () => {
    it('should have messages in conversations', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM messages
      `);
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });
  });

  describe('Quick Reply Templates', () => {
    it('should have quick reply templates', async () => {
      const result = await query(`
        SELECT COUNT(*) as count FROM quick_reply_templates
      `);
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should have templates for both tenants and landlords', async () => {
      const tenantResult = await query(`
        SELECT COUNT(*) as count FROM quick_reply_templates
        WHERE user_role = 'tenant' OR user_role = 'both'
      `);
      const landlordResult = await query(`
        SELECT COUNT(*) as count FROM quick_reply_templates
        WHERE user_role = 'landlord' OR user_role = 'both'
      `);
      
      expect(parseInt(tenantResult.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(landlordResult.rows[0].count)).toBeGreaterThan(0);
    });
  });
});

/**
 * Test different user scenarios
 */
describe('User Journey Scenarios', () => {
  describe('New User (9999999999)', () => {
    it('should exist with incomplete profile', async () => {
      const result = await query(`
        SELECT * FROM users WHERE phone = '9999999999'
      `);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].profile_completed).toBe(false);
    });

    it('should not have a tenant profile yet', async () => {
      const userResult = await query(`SELECT id FROM users WHERE phone = '9999999999'`);
      const profileResult = await query(`
        SELECT * FROM tenant_profiles WHERE user_id = $1
      `, [userResult.rows[0].id]);
      expect(profileResult.rows.length).toBe(0);
    });
  });

  describe('Existing Full Home Tenant (9876540001)', () => {
    it('should have complete profile', async () => {
      const result = await query(`
        SELECT u.*, tp.search_type, tp.budget_min, tp.budget_max
        FROM users u
        JOIN tenant_profiles tp ON u.id = tp.user_id
        WHERE u.phone = '9876540001'
      `);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].profile_completed).toBe(true);
      expect(result.rows[0].search_type).toBe('full_home');
    });

    it('should have matches', async () => {
      const userResult = await query(`SELECT id FROM users WHERE phone = '9876540001'`);
      const matchesResult = await query(`
        SELECT COUNT(*) as count FROM matches WHERE tenant_id = $1
      `, [userResult.rows[0].id]);
      expect(parseInt(matchesResult.rows[0].count)).toBeGreaterThan(0);
    });
  });

  describe('Existing Room Sharing Tenant (9876540006)', () => {
    it('should have room sharing profile', async () => {
      const result = await query(`
        SELECT u.*, tp.search_type, tp.preferences
        FROM users u
        JOIN tenant_profiles tp ON u.id = tp.user_id
        WHERE u.phone = '9876540006'
      `);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].search_type).toBe('room_sharing');
    });
  });

  describe('Existing Landlord (9123450001)', () => {
    it('should have landlord profile with properties', async () => {
      const userResult = await query(`
        SELECT u.id, u.name, lp.*
        FROM users u
        JOIN landlord_profiles lp ON u.id = lp.user_id
        WHERE u.phone = '9123450001'
      `);
      expect(userResult.rows.length).toBe(1);
      
      const propertiesResult = await query(`
        SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1
      `, [userResult.rows[0].user_id]);
      expect(parseInt(propertiesResult.rows[0].count)).toBeGreaterThan(0);
    });
  });
});
