import { pgPool, query } from '../database/client';

/**
 * Database testing helpers
 * 
 * Why separate test helpers?
 * - Clean database between tests (test isolation)
 * - Create test data easily
 * - Avoid polluting production database
 */

/**
 * Clean all tables (for tests)
 */
export const cleanDatabase = async (): Promise<void> => {
  await query('TRUNCATE users, properties, matches, deals, auth_sessions RESTART IDENTITY CASCADE');
};

/**
 * Create test user
 */
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    phone: '9876543210',
    name: 'Test User',
    role: 'tenant',
    ...overrides,
  };
  
  const result = await query(
    `INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING *`,
    [defaultUser.phone, defaultUser.name, defaultUser.role]
  );
  
  return result.rows[0];
};

/**
 * Create test property
 */
export const createTestProperty = async (landlordId: string, overrides: any = {}) => {
  const defaultProperty = {
    address: 'Test Address, Bangalore',
    latitude: 12.9716,
    longitude: 77.5946,
    neighborhood: 'Koramangala',
    property_type: 'apartment',
    configuration: '2bhk',
    size_sqft: 1200,
    furnishing: 'semi_furnished',
    rent: 35000,
    security_deposit: 70000,
    amenities: JSON.stringify(['gym', 'parking']),
    status: 'available',
    available_from: '2026-02-01',
    ...overrides,
  };
  
  const result = await query(
    `INSERT INTO properties (
      landlord_id, address, latitude, longitude, neighborhood,
      property_type, configuration, size_sqft, furnishing,
      rent, security_deposit, amenities, status, available_from
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      landlordId,
      defaultProperty.address,
      defaultProperty.latitude,
      defaultProperty.longitude,
      defaultProperty.neighborhood,
      defaultProperty.property_type,
      defaultProperty.configuration,
      defaultProperty.size_sqft,
      defaultProperty.furnishing,
      defaultProperty.rent,
      defaultProperty.security_deposit,
      defaultProperty.amenities,
      defaultProperty.status,
      defaultProperty.available_from,
    ]
  );
  
  return result.rows[0];
};

/**
 * Close database connection after tests
 */
export const closeDatabase = async (): Promise<void> => {
  await pgPool.end();
};
