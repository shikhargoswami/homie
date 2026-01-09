import { query, transaction } from './client';
import { PoolClient } from 'pg';

/**
 * Seed development data
 * 
 * Why seed data?
 * - Test app without manually creating data
 * - Consistent development environment across team
 * - Demo data for investors/stakeholders
 */

const seedUsers = async (client: PoolClient) => {
  console.log('📝 Seeding users...');
  
  // Create 10 tenants
  for (let i = 1; i <= 10; i++) {
    await client.query(`
      INSERT INTO users (phone, email, name, role, profile_completed)
      VALUES ($1, $2, $3, 'tenant', true)
      ON CONFLICT (phone) DO NOTHING
    `, [`987654${i.toString().padStart(4, '0')}`, `tenant${i}@homie.test`, `Tenant ${i}`]);
  }
  
  // Create 5 landlords
  for (let i = 1; i <= 5; i++) {
    await client.query(`
      INSERT INTO users (phone, email, name, role, profile_completed)
      VALUES ($1, $2, $3, 'landlord', true)
      ON CONFLICT (phone) DO NOTHING
    `, [`912345${i.toString().padStart(4, '0')}`, `landlord${i}@homie.test`, `Landlord ${i}`]);
  }
  
  console.log('✅ Users seeded');
};

const seedTenantProfiles = async (client: PoolClient) => {
  console.log('📝 Seeding tenant profiles...');
  
  const tenants = await client.query(`
    SELECT id FROM users WHERE role = 'tenant' LIMIT 10
  `);
  
  const preferences = {
    nonNegotiables: {
      budget: { min: 20000, max: 40000 },
      location: 'Koramangala',
      bhkType: ['2bhk', '3bhk'],
      furnishing: 'semi_furnished',
      moveInDate: '2026-02-01'
    },
    mustHaves: {
      amenities: ['gym', 'parking', 'swimming_pool'],
      homeOfficeSpace: true,
      gatedCommunity: true,
      maxCommute: 30
    },
    niceToHaves: {
      aestheticPreference: 'modern',
      communityVibe: 'social',
      noiseLevel: 'quiet'
    }
  };
  
  for (const tenant of tenants.rows) {
    await client.query(`
      INSERT INTO tenant_profiles (
        user_id, search_type, budget_min, budget_max, preferences
      ) VALUES ($1, 'full_home', 20000, 40000, $2)
      ON CONFLICT (user_id) DO NOTHING
    `, [tenant.id, JSON.stringify(preferences)]);
  }
  
  console.log('✅ Tenant profiles seeded');
};

const seedLandlordProfiles = async (client: PoolClient) => {
  console.log('📝 Seeding landlord profiles...');
  
  const landlords = await client.query(`
    SELECT id FROM users WHERE role = 'landlord' LIMIT 5
  `);
  
  for (const landlord of landlords.rows) {
    await client.query(`
      INSERT INTO landlord_profiles (
        user_id, subscription_tier, rating, rating_count
      ) VALUES ($1, 'pro', 4.5, 10)
      ON CONFLICT (user_id) DO NOTHING
    `, [landlord.id]);
  }
  
  console.log('✅ Landlord profiles seeded');
};

const seedProperties = async (client: PoolClient) => {
  console.log('📝 Seeding properties...');
  
  const landlords = await client.query(`
    SELECT id FROM users WHERE role = 'landlord' LIMIT 5
  `);
  
  const neighborhoods = [
    { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
    { name: 'Indiranagar', lat: 12.9716, lng: 77.6412 },
    { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
    { name: 'HSR Layout', lat: 12.9122, lng: 77.6388 },
    { name: 'Bellandur', lat: 12.9256, lng: 77.6752 },
  ];
  
  const configurations = ['1bhk', '2bhk', '3bhk'];
  const furnishings = ['unfurnished', 'semi_furnished', 'fully_furnished'];
  
  // Create 2 properties per landlord
  for (const landlord of landlords.rows) {
    for (let i = 0; i < 2; i++) {
      const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      const config = configurations[Math.floor(Math.random() * configurations.length)];
      const furnishing = furnishings[Math.floor(Math.random() * furnishings.length)];
      const rent = 25000 + Math.floor(Math.random() * 30000);
      
      await client.query(`
        INSERT INTO properties (
          landlord_id, address, latitude, longitude, neighborhood,
          property_type, configuration, size_sqft, floor_number, total_floors,
          furnishing, rent, security_deposit, maintenance_charge,
          amenities, status, available_from
        ) VALUES (
          $1, $2, $3, $4, $5,
          'apartment', $6, $7, $8, $9,
          $10, $11, $12, 2500,
          $13, 'available', '2026-02-01'
        )
      `, [
        landlord.id,
        `${i + 1}, ${neighborhood.name}, Bangalore`,
        neighborhood.lat + (Math.random() - 0.5) * 0.01,
        neighborhood.lng + (Math.random() - 0.5) * 0.01,
        neighborhood.name,
        config,
        1200 + Math.floor(Math.random() * 800),
        Math.floor(Math.random() * 10) + 1,
        12,
        furnishing,
        rent,
        rent * 2,
        JSON.stringify(['gym', 'parking', 'swimming_pool', '24/7 security'])
      ]);
    }
  }
  
  console.log('✅ Properties seeded');
};

/**
 * Main seed function
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding database...');
    
    await transaction(async (client) => {
      await seedUsers(client);
      await seedTenantProfiles(client);
      await seedLandlordProfiles(client);
      await seedProperties(client);
    });
    
    console.log('🎉 Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
