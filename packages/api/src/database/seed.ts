import { query, transaction } from './client';
import { PoolClient } from 'pg';

/**
 * Seed development data
 * 
 * User Types:
 * 1. Full Home Tenants - Looking for complete apartments/houses
 * 2. Room Sharing Tenants (Flatmates) - Looking for a room in shared accommodation
 * 3. Landlords - Property owners listing their properties
 */

const seedUsers = async (client: PoolClient) => {
  console.log('📝 Seeding users...');
  
  // Create 5 Full Home Tenants
  const fullHomeTenants = [
    { phone: '9876540001', email: 'rahul@homie.test', name: 'Rahul Sharma' },
    { phone: '9876540002', email: 'priya@homie.test', name: 'Priya Patel' },
    { phone: '9876540003', email: 'amit@homie.test', name: 'Amit Kumar' },
    { phone: '9876540004', email: 'neha@homie.test', name: 'Neha Gupta' },
    { phone: '9876540005', email: 'vikram@homie.test', name: 'Vikram Singh' },
  ];
  
  for (const tenant of fullHomeTenants) {
    await client.query(`
      INSERT INTO users (phone, email, name, role, profile_completed)
      VALUES ($1, $2, $3, 'tenant', true)
      ON CONFLICT (phone) DO NOTHING
    `, [tenant.phone, tenant.email, tenant.name]);
  }
  
  // Create 5 Room Sharing Tenants (Flatmates)
  const roomSharingTenants = [
    { phone: '9876540006', email: 'ankit@homie.test', name: 'Ankit Verma' },
    { phone: '9876540007', email: 'shruti@homie.test', name: 'Shruti Reddy' },
    { phone: '9876540008', email: 'karan@homie.test', name: 'Karan Mehta' },
    { phone: '9876540009', email: 'divya@homie.test', name: 'Divya Nair' },
    { phone: '9876540010', email: 'rohan@homie.test', name: 'Rohan Joshi' },
  ];
  
  for (const tenant of roomSharingTenants) {
    await client.query(`
      INSERT INTO users (phone, email, name, role, profile_completed)
      VALUES ($1, $2, $3, 'tenant', true)
      ON CONFLICT (phone) DO NOTHING
    `, [tenant.phone, tenant.email, tenant.name]);
  }
  
  // Create 5 Landlords
  const landlords = [
    { phone: '9123450001', email: 'landlord.ramesh@homie.test', name: 'Ramesh Iyer' },
    { phone: '9123450002', email: 'landlord.sunita@homie.test', name: 'Sunita Rao' },
    { phone: '9123450003', email: 'landlord.arun@homie.test', name: 'Arun Properties' },
    { phone: '9123450004', email: 'landlord.meera@homie.test', name: 'Meera Kapoor' },
    { phone: '9123450005', email: 'landlord.rajesh@homie.test', name: 'Rajesh Builders' },
  ];
  
  for (const landlord of landlords) {
    await client.query(`
      INSERT INTO users (phone, email, name, role, profile_completed)
      VALUES ($1, $2, $3, 'landlord', true)
      ON CONFLICT (phone) DO NOTHING
    `, [landlord.phone, landlord.email, landlord.name]);
  }
  
  // Create test user (for easy testing - OTP bypass with 123456)
  await client.query(`
    INSERT INTO users (phone, email, name, role, profile_completed)
    VALUES ('9999999999', 'test@homie.test', 'Test User', 'tenant', false)
    ON CONFLICT (phone) DO NOTHING
  `);
  
  console.log('✅ Users seeded (5 full home tenants, 5 flatmates, 5 landlords, 1 test user)');
};

const seedTenantProfiles = async (client: PoolClient) => {
  console.log('📝 Seeding tenant profiles...');
  
  // Full Home Tenant Profiles
  const fullHomeTenants = await client.query(`
    SELECT id, name FROM users WHERE phone LIKE '987654000%' LIMIT 5
  `);
  
  const fullHomePreferences = [
    {
      searchType: 'full_home',
      budgetMin: 25000,
      budgetMax: 45000,
      locations: ['Koramangala', 'Indiranagar'],
      propertyTypes: ['apartment'],
      configurations: ['2bhk'],
      furnishing: ['semi_furnished', 'fully_furnished'],
      employment: 'employed',
      preferences: {
        nonNegotiables: {
          gatedCommunity: true,
          parking: true,
        },
        mustHaves: {
          amenities: ['gym', 'swimming_pool'],
          homeOfficeSpace: true,
        },
        niceToHaves: {
          aestheticPreference: 'modern',
          petFriendly: false,
        },
      },
    },
    {
      searchType: 'full_home',
      budgetMin: 35000,
      budgetMax: 60000,
      locations: ['Whitefield', 'Bellandur'],
      propertyTypes: ['apartment', 'villa'],
      configurations: ['3bhk'],
      furnishing: ['fully_furnished'],
      employment: 'employed',
      preferences: {
        nonNegotiables: {
          gatedCommunity: true,
          security: true,
        },
        mustHaves: {
          amenities: ['gym', 'club_house', 'children_play_area'],
          garden: true,
        },
        niceToHaves: {
          aestheticPreference: 'luxury',
          petFriendly: true,
        },
      },
    },
    {
      searchType: 'full_home',
      budgetMin: 15000,
      budgetMax: 25000,
      locations: ['HSR Layout', 'BTM Layout'],
      propertyTypes: ['apartment'],
      configurations: ['1bhk'],
      furnishing: ['unfurnished', 'semi_furnished'],
      employment: 'student',
      preferences: {
        nonNegotiables: {
          nearMetro: true,
        },
        mustHaves: {
          amenities: ['wifi', 'power_backup'],
        },
        niceToHaves: {
          quietNeighborhood: true,
        },
      },
    },
    {
      searchType: 'full_home',
      budgetMin: 40000,
      budgetMax: 70000,
      locations: ['Indiranagar', 'Koramangala', 'JP Nagar'],
      propertyTypes: ['apartment', 'house'],
      configurations: ['3bhk', '4bhk+'],
      furnishing: ['fully_furnished'],
      employment: 'self_employed',
      preferences: {
        nonNegotiables: {
          separateEntrance: true,
          parking: true,
        },
        mustHaves: {
          amenities: ['gym', 'terrace'],
          homeOfficeSpace: true,
        },
        niceToHaves: {
          rooftopAccess: true,
        },
      },
    },
    {
      searchType: 'full_home',
      budgetMin: 20000,
      budgetMax: 35000,
      locations: ['Electronic City', 'Sarjapur Road'],
      propertyTypes: ['apartment'],
      configurations: ['2bhk'],
      furnishing: ['semi_furnished'],
      employment: 'employed',
      preferences: {
        nonNegotiables: {
          nearTechPark: true,
        },
        mustHaves: {
          amenities: ['gym', 'parking'],
          powerBackup: true,
        },
        niceToHaves: {
          balcony: true,
        },
      },
    },
  ];

  let i = 0;
  for (const tenant of fullHomeTenants.rows) {
    const pref = fullHomePreferences[i] || fullHomePreferences[0];
    await client.query(`
      INSERT INTO tenant_profiles (
        user_id, search_type, budget_min, budget_max, employment_status, preferences
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET
        search_type = $2,
        budget_min = $3,
        budget_max = $4,
        employment_status = $5,
        preferences = $6
    `, [tenant.id, pref.searchType, pref.budgetMin, pref.budgetMax, pref.employment, JSON.stringify(pref.preferences)]);
    i++;
  }

  // Room Sharing Tenant (Flatmate) Profiles
  const roomSharingTenants = await client.query(`
    SELECT id, name FROM users WHERE phone LIKE '987654001%' OR phone IN ('9876540006', '9876540007', '9876540008', '9876540009', '9876540010') LIMIT 5
  `);

  const roomSharingPreferences = [
    {
      searchType: 'room_sharing',
      budgetMin: 8000,
      budgetMax: 15000,
      locations: ['Koramangala', 'HSR Layout'],
      genderPreference: 'male',
      employment: 'employed',
      lifestylePreferences: ['non_smoker', 'vegetarian', 'early_riser', 'work_from_home'],
      preferences: {
        flatmatePreferences: {
          ageRange: '22-30',
          profession: 'working_professional',
          cleanliness: 'high',
        },
      },
    },
    {
      searchType: 'room_sharing',
      budgetMin: 10000,
      budgetMax: 18000,
      locations: ['Indiranagar', 'Koramangala'],
      genderPreference: 'female',
      employment: 'employed',
      lifestylePreferences: ['non_smoker', 'social', 'night_owl'],
      preferences: {
        flatmatePreferences: {
          ageRange: '24-32',
          profession: 'working_professional',
          cleanliness: 'medium',
        },
      },
    },
    {
      searchType: 'room_sharing',
      budgetMin: 6000,
      budgetMax: 12000,
      locations: ['BTM Layout', 'JP Nagar'],
      genderPreference: 'any',
      employment: 'student',
      lifestylePreferences: ['non_smoker', 'quiet', 'pet_friendly'],
      preferences: {
        flatmatePreferences: {
          ageRange: '20-26',
          profession: 'student',
          cleanliness: 'medium',
        },
      },
    },
    {
      searchType: 'room_sharing',
      budgetMin: 12000,
      budgetMax: 20000,
      locations: ['Whitefield', 'Marathahalli'],
      genderPreference: 'male',
      employment: 'employed',
      lifestylePreferences: ['non_smoker', 'work_from_home', 'social'],
      preferences: {
        flatmatePreferences: {
          ageRange: '25-35',
          profession: 'working_professional',
          cleanliness: 'high',
        },
      },
    },
    {
      searchType: 'room_sharing',
      budgetMin: 7000,
      budgetMax: 14000,
      locations: ['Electronic City', 'Sarjapur Road'],
      genderPreference: 'any',
      employment: 'employed',
      lifestylePreferences: ['vegetarian', 'early_riser', 'quiet'],
      preferences: {
        flatmatePreferences: {
          ageRange: '22-30',
          profession: 'working_professional',
          cleanliness: 'high',
        },
      },
    },
  ];

  i = 0;
  for (const tenant of roomSharingTenants.rows) {
    const pref = roomSharingPreferences[i] || roomSharingPreferences[0];
    await client.query(`
      INSERT INTO tenant_profiles (
        user_id, search_type, budget_min, budget_max, employment_status, preferences
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET
        search_type = $2,
        budget_min = $3,
        budget_max = $4,
        employment_status = $5,
        preferences = $6
    `, [tenant.id, pref.searchType, pref.budgetMin, pref.budgetMax, pref.employment, JSON.stringify({
      ...pref.preferences,
      genderPreference: pref.genderPreference,
      lifestylePreferences: pref.lifestylePreferences,
      preferredLocations: pref.locations,
    })]);
    i++;
  }
  
  console.log('✅ Tenant profiles seeded (5 full home, 5 room sharing)');
};

const seedLandlordProfiles = async (client: PoolClient) => {
  console.log('📝 Seeding landlord profiles...');
  
  const landlords = await client.query(`
    SELECT id, name FROM users WHERE role = 'landlord' LIMIT 5
  `);

  const landlordData = [
    { subscriptionTier: 'pro', rating: 4.8, ratingCount: 25, totalTenants: 15 },
    { subscriptionTier: 'free', rating: 4.2, ratingCount: 8, totalTenants: 5 },
    { subscriptionTier: 'business', rating: 4.9, ratingCount: 50, totalTenants: 35 },
    { subscriptionTier: 'pro', rating: 4.5, ratingCount: 12, totalTenants: 8 },
    { subscriptionTier: 'business', rating: 4.7, ratingCount: 40, totalTenants: 28 },
  ];

  let i = 0;
  for (const landlord of landlords.rows) {
    const data = landlordData[i] || landlordData[0];
    await client.query(`
      INSERT INTO landlord_profiles (
        user_id, subscription_tier, rating, rating_count, total_tenants
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        subscription_tier = $2,
        rating = $3,
        rating_count = $4,
        total_tenants = $5
    `, [landlord.id, data.subscriptionTier, data.rating, data.ratingCount, data.totalTenants]);
    i++;
  }
  
  console.log('✅ Landlord profiles seeded');
};

const seedProperties = async (client: PoolClient) => {
  console.log('📝 Seeding properties...');
  
  const landlords = await client.query(`
    SELECT id, name FROM users WHERE role = 'landlord' LIMIT 5
  `);
  
  const propertyData = [
    // Properties for full home tenants
    {
      address: 'Sunny Heights, 3rd Block, Koramangala',
      lat: 12.9352,
      lng: 77.6245,
      neighborhood: 'Koramangala',
      propertyType: 'apartment',
      config: '2bhk',
      sqft: 1200,
      floor: 5,
      totalFloors: 12,
      furnishing: 'semi_furnished',
      rent: 32000,
      deposit: 64000,
      amenities: ['gym', 'swimming_pool', 'parking', '24/7 security', 'power_backup', 'lift'],
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    },
    {
      address: 'Green Valley Apartments, Indiranagar',
      lat: 12.9716,
      lng: 77.6412,
      neighborhood: 'Indiranagar',
      propertyType: 'apartment',
      config: '3bhk',
      sqft: 1800,
      floor: 8,
      totalFloors: 15,
      furnishing: 'fully_furnished',
      rent: 55000,
      deposit: 110000,
      amenities: ['gym', 'swimming_pool', 'club_house', 'parking', '24/7 security', 'children_play_area'],
      photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    },
    {
      address: 'Tech Park Residency, Whitefield',
      lat: 12.9698,
      lng: 77.7500,
      neighborhood: 'Whitefield',
      propertyType: 'apartment',
      config: '2bhk',
      sqft: 1100,
      floor: 3,
      totalFloors: 10,
      furnishing: 'semi_furnished',
      rent: 28000,
      deposit: 56000,
      amenities: ['gym', 'parking', '24/7 security', 'power_backup'],
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    },
    {
      address: 'Lake View Villa, HSR Layout',
      lat: 12.9122,
      lng: 77.6388,
      neighborhood: 'HSR Layout',
      propertyType: 'villa',
      config: '4bhk+',
      sqft: 3200,
      floor: 0,
      totalFloors: 2,
      furnishing: 'fully_furnished',
      rent: 85000,
      deposit: 170000,
      amenities: ['private_garden', 'parking', 'terrace', 'home_office', 'power_backup'],
      photos: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    },
    {
      address: 'Metro View Apartments, Electronic City',
      lat: 12.8456,
      lng: 77.6603,
      neighborhood: 'Electronic City',
      propertyType: 'apartment',
      config: '1bhk',
      sqft: 650,
      floor: 2,
      totalFloors: 8,
      furnishing: 'unfurnished',
      rent: 15000,
      deposit: 30000,
      amenities: ['parking', '24/7 security', 'power_backup'],
      photos: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    },
    // Properties for room sharing / PG
    {
      address: 'Flatmates Co-Living, Koramangala 4th Block',
      lat: 12.9341,
      lng: 77.6229,
      neighborhood: 'Koramangala',
      propertyType: 'pg',
      config: '1bhk',
      sqft: 300,
      floor: 2,
      totalFloors: 4,
      furnishing: 'fully_furnished',
      rent: 12000,
      deposit: 12000,
      amenities: ['wifi', 'housekeeping', 'meals', 'laundry', 'common_area'],
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
      tenantPrefs: { genderPreference: 'male', maxOccupants: 1 },
    },
    {
      address: 'Shared Space, BTM Layout 2nd Stage',
      lat: 12.9167,
      lng: 77.6101,
      neighborhood: 'BTM Layout',
      propertyType: 'pg',
      config: '1bhk',
      sqft: 250,
      floor: 1,
      totalFloors: 3,
      furnishing: 'fully_furnished',
      rent: 9000,
      deposit: 9000,
      amenities: ['wifi', 'housekeeping', 'common_kitchen', 'laundry'],
      photos: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800'],
      tenantPrefs: { genderPreference: 'female', maxOccupants: 1 },
    },
    {
      address: 'Urban Nest Co-Living, Marathahalli',
      lat: 12.9591,
      lng: 77.6974,
      neighborhood: 'Marathahalli',
      propertyType: 'pg',
      config: '1bhk',
      sqft: 280,
      floor: 3,
      totalFloors: 5,
      furnishing: 'fully_furnished',
      rent: 10500,
      deposit: 10500,
      amenities: ['wifi', 'gym', 'housekeeping', 'meals', 'common_area', 'game_room'],
      photos: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800'],
      tenantPrefs: { genderPreference: 'any', maxOccupants: 2 },
    },
    {
      address: 'Premium PG, Sarjapur Road',
      lat: 12.9081,
      lng: 77.6871,
      neighborhood: 'Sarjapur Road',
      propertyType: 'pg',
      config: '1bhk',
      sqft: 320,
      floor: 4,
      totalFloors: 6,
      furnishing: 'fully_furnished',
      rent: 14000,
      deposit: 14000,
      amenities: ['wifi', 'ac', 'gym', 'housekeeping', 'meals', 'power_backup'],
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      tenantPrefs: { genderPreference: 'male', maxOccupants: 1 },
    },
    {
      address: 'Harmony Living Spaces, JP Nagar',
      lat: 12.9063,
      lng: 77.5857,
      neighborhood: 'JP Nagar',
      propertyType: 'pg',
      config: '1bhk',
      sqft: 270,
      floor: 2,
      totalFloors: 4,
      furnishing: 'fully_furnished',
      rent: 8500,
      deposit: 8500,
      amenities: ['wifi', 'housekeeping', 'common_kitchen', 'laundry', 'study_room'],
      photos: ['https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'],
      tenantPrefs: { genderPreference: 'any', maxOccupants: 1 },
    },
  ];

  // Distribute properties among landlords
  for (let i = 0; i < propertyData.length; i++) {
    const prop = propertyData[i];
    const landlordIndex = i % landlords.rows.length;
    const landlord = landlords.rows[landlordIndex];

    await client.query(`
      INSERT INTO properties (
        landlord_id, address, latitude, longitude, neighborhood,
        property_type, configuration, size_sqft, floor_number, total_floors,
        furnishing, rent, security_deposit, maintenance_charge,
        amenities, photos, tenant_preferences, status, available_from
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, 'available', '2025-02-01'
      )
    `, [
      landlord.id,
      prop.address,
      prop.lat,
      prop.lng,
      prop.neighborhood,
      prop.propertyType,
      prop.config,
      prop.sqft,
      prop.floor,
      prop.totalFloors,
      prop.furnishing,
      prop.rent,
      prop.deposit,
      Math.round(prop.rent * 0.08), // 8% maintenance
      JSON.stringify(prop.amenities),
      JSON.stringify(prop.photos),
      JSON.stringify(prop.tenantPrefs || {}),
    ]);
  }
  
  console.log('✅ Properties seeded (5 full homes, 5 PG/room sharing)');
};

/**
 * Seed conversations and messages for testing chat
 */
const seedConversations = async (client: PoolClient) => {
  console.log('📝 Seeding conversations and messages...');
  
  // Get matches with their tenant and property info
  const matchesResult = await client.query(`
    SELECT m.id as match_id, m.tenant_id, p.id as property_id, p.landlord_id, p.address
    FROM matches m
    JOIN properties p ON m.property_id = p.id
    WHERE m.status = 'interested'
    LIMIT 3
  `);

  if (matchesResult.rows.length === 0) {
    console.log('⚠️ Skipping conversations seed - no matches found');
    return;
  }

  for (const match of matchesResult.rows) {
    // Create conversation
    const convResult = await client.query(`
      INSERT INTO conversations (match_id, property_id, tenant_id, landlord_id, status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (match_id) DO UPDATE SET status = 'active'
      RETURNING id
    `, [match.match_id, match.property_id, match.tenant_id, match.landlord_id]);

    const conversationId = convResult.rows[0].id;

    // Add sample messages
    const messages = [
      { sender: match.tenant_id, content: `Hi, I'm interested in your property at ${match.address}. Is it still available?`, type: 'text' },
      { sender: match.landlord_id, content: 'Yes, it is still available! Would you like to schedule a viewing?', type: 'text' },
      { sender: match.tenant_id, content: 'Yes, that would be great! I\'m available this weekend.', type: 'text' },
      { sender: match.landlord_id, content: 'Perfect! How about Saturday at 11 AM?', type: 'text' },
    ];

    for (const msg of messages) {
      await client.query(`
        INSERT INTO messages (conversation_id, sender_id, content, message_type)
        VALUES ($1, $2, $3, $4)
      `, [conversationId, msg.sender, msg.content, msg.type]);
      
      // Small delay between messages for realistic timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  console.log('✅ Conversations seeded (3 conversations with sample messages)');
};

/**
 * Seed viewings for testing calendar/scheduling
 */
const seedViewings = async (client: PoolClient) => {
  console.log('📝 Seeding viewings...');

  // Get conversations with all related info
  const conversationsResult = await client.query(`
    SELECT c.id as conversation_id, c.match_id, c.property_id, c.tenant_id, c.landlord_id
    FROM conversations c
    LIMIT 5
  `);

  if (conversationsResult.rows.length === 0) {
    console.log('⚠️ Skipping viewings seed - no conversations found');
    return;
  }

  const viewingStatuses = ['proposed', 'confirmed', 'completed', 'cancelled'];
  const today = new Date();

  for (let i = 0; i < conversationsResult.rows.length; i++) {
    const conv = conversationsResult.rows[i];
    const status = viewingStatuses[i % viewingStatuses.length];
    
    // Schedule viewings for the next few days
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + i + 1);
    scheduledDate.setHours(10 + i, 0, 0, 0);

    await client.query(`
      INSERT INTO viewings (conversation_id, match_id, property_id, tenant_id, landlord_id, proposed_datetime, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [
      conv.conversation_id,
      conv.match_id,
      conv.property_id,
      conv.tenant_id,
      conv.landlord_id,
      scheduledDate.toISOString(),
      status
    ]);
  }

  console.log('✅ Viewings seeded');
};

/**
 * Seed matches (likes/passes) for testing discovery
 */
const seedMatches = async (client: PoolClient) => {
  console.log('📝 Seeding matches...');

  // Get tenants
  const tenantsResult = await client.query(`
    SELECT id FROM users WHERE role = 'tenant' AND profile_completed = true
  `);

  // Get all properties
  const propertiesResult = await client.query(`
    SELECT id FROM properties
  `);

  if (tenantsResult.rows.length === 0 || propertiesResult.rows.length === 0) {
    console.log('⚠️ Skipping matches seed - no users/properties found');
    return;
  }

  // Create some likes and passes for each tenant
  for (const tenant of tenantsResult.rows) {
    const shuffledProperties = propertiesResult.rows.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(5, shuffledProperties.length); i++) {
      const property = shuffledProperties[i];
      const status = i < 3 ? 'interested' : 'declined'; // 3 likes, 2 passes
      const score = 50 + Math.floor(Math.random() * 45); // 50-95%
      const swipeDir = i < 3 ? 'right' : 'left';
      
      await client.query(`
        INSERT INTO matches (tenant_id, property_id, status, match_score, tenant_swiped, tenant_swipe_direction, tenant_swiped_at)
        VALUES ($1, $2, $3, $4, true, $5, NOW())
        ON CONFLICT (tenant_id, property_id) DO UPDATE SET status = $3, match_score = $4
      `, [
        tenant.id,
        property.id,
        status,
        score,
        swipeDir
      ]);
    }
  }

  console.log('✅ Matches seeded (likes and passes for each tenant)');
};

/**
 * Seed reviews for testing landlord ratings
 * Note: Reviews require a deal_id in the schema, so we'll skip this for now
 * as deals aren't seeded. The actual reviews table structure requires completed deals.
 */
const seedReviews = async (client: PoolClient) => {
  console.log('📝 Skipping reviews seed (requires completed deals)...');
  // Reviews in the schema require deal_id which we don't have yet
  // This would be populated after real rental agreements are completed
  console.log('✅ Reviews skipped (no deals to review yet)');
};

/**
 * Note: Quick reply templates are already seeded in schema-chat.sql
 * This function verifies they exist
 */
const seedQuickReplies = async (client: PoolClient) => {
  console.log('📝 Verifying quick reply templates...');

  const result = await client.query(`
    SELECT COUNT(*) as count FROM quick_reply_templates
  `);

  if (parseInt(result.rows[0].count) === 0) {
    // If templates don't exist, seed them
    const quickReplies = [
      { category: 'greeting', title: 'Introduction', content: 'Hi! I\'m interested in this property.', role: 'tenant' },
      { category: 'greeting', title: 'Availability', content: 'Hello! Is this property still available?', role: 'tenant' },
      { category: 'scheduling', title: 'Schedule Viewing', content: 'Can we schedule a viewing?', role: 'tenant' },
      { category: 'scheduling', title: 'Weekend Availability', content: 'I\'m available this weekend for a viewing.', role: 'tenant' },
      { category: 'scheduling', title: 'Time Check', content: 'What times work best for you?', role: 'both' },
      { category: 'inquiry', title: 'Negotiation', content: 'Would you consider a lower rent?', role: 'tenant' },
      { category: 'inquiry', title: 'Maintenance', content: 'What\'s included in the maintenance?', role: 'tenant' },
      { category: 'inquiry', title: 'Deposit', content: 'Is the deposit negotiable?', role: 'tenant' },
      { category: 'closing', title: 'Thanks', content: 'Thank you for your response!', role: 'both' },
      { category: 'closing', title: 'Follow Up', content: 'I\'ll get back to you soon.', role: 'both' },
      { category: 'inquiry', title: 'Photos', content: 'Can you share more photos?', role: 'tenant' },
    ];

    for (const qr of quickReplies) {
      await client.query(`
        INSERT INTO quick_reply_templates (category, title, content, user_role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [qr.category, qr.title, qr.content, qr.role]);
    }
    console.log('✅ Quick reply templates seeded');
  } else {
    console.log('✅ Quick reply templates already exist');
  }
};

/**
 * Main seed function
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding database with comprehensive user type data...');
    console.log('');
    console.log('User Types being seeded:');
    console.log('  📦 Full Home Tenants (5) - Looking for complete apartments/houses');
    console.log('  🏠 Room Sharing Tenants (5) - Looking for flatmate/PG accommodation');
    console.log('  🏢 Landlords (5) - Property owners with various portfolio sizes');
    console.log('  🧪 Test User (1) - For development testing (phone: 9999999999)');
    console.log('');
    
    await transaction(async (client) => {
      await seedUsers(client);
      await seedTenantProfiles(client);
      await seedLandlordProfiles(client);
      await seedProperties(client);
      await seedConversations(client);
      await seedViewings(client);
      await seedMatches(client);
      await seedReviews(client);
      await seedQuickReplies(client);
    });
    
    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('Test Credentials:');
    console.log('  Phone: 9999999999 (new user - will go through onboarding)');
    console.log('  Phone: 9876540001 (existing full home tenant with messages/viewings)');
    console.log('  Phone: 9876540006 (existing room sharing tenant)');
    console.log('  Phone: 9123450001 (existing landlord with properties)');
    console.log('  OTP: 123456 (bypass code for development)');
    console.log('');
    console.log('Test Scenarios:');
    console.log('  📱 New User Flow: Use 9999999999 to test full onboarding');
    console.log('  💬 Chat Flow: Use 9876540001 to test existing conversations');
    console.log('  📅 Viewing Flow: Multiple viewings in various states');
    console.log('  ❤️ Matching Flow: Swipe through properties with match scores');
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
