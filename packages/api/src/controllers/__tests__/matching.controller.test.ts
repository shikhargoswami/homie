import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import app from '../../index';
import { cleanDatabase, createTestUser, createTestProperty, closeDatabase } from '../../test/db-helper';
import { redisClient, query } from '../../database/client';
import { generateAccessToken } from '../../services/token.service';

describe('Matching Controller', () => {
  let tenant: any;
  let landlord: any;
  let property1: any;
  let property2: any;
  let tenantToken: string;
  let landlordToken: string;
  
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  
  beforeEach(async () => {
    await cleanDatabase();
    
    // Clear Redis cache
    const keys = await redisClient.keys('recommendations:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    const swipeKeys = await redisClient.keys('swipes:*');
    if (swipeKeys.length > 0) {
      await redisClient.del(swipeKeys);
    }
    
    // Create test users
    tenant = await createTestUser({ phone: '9876543210', role: 'tenant' });
    landlord = await createTestUser({ phone: '9876543211', role: 'landlord' });
    
    // Generate tokens
    tenantToken = generateAccessToken({
      userId: tenant.id,
      phone: tenant.phone,
      role: tenant.role,
    });
    
    landlordToken = generateAccessToken({
      userId: landlord.id,
      phone: landlord.phone,
      role: landlord.role,
    });
    
    // Create tenant profile with preferences
    await query(
      `INSERT INTO tenant_profiles (user_id, search_type, budget_min, budget_max, preferences)
       VALUES ($1, 'full_home', 20000, 40000, $2)`,
      [
        tenant.id,
        JSON.stringify({
          nonNegotiables: {
            budget: { min: 20000, max: 40000 },
            location: 'Koramangala',
            bhkType: ['2bhk', '3bhk'],
            furnishing: 'semi_furnished',
            moveInDate: '2026-02-01',
          },
          mustHaves: {
            amenities: ['gym', 'parking'],
          },
          niceToHaves: {},
        }),
      ]
    );
    
    // Create properties
    property1 = await createTestProperty(landlord.id, {
      rent: 30000,
      neighborhood: 'Koramangala',
      configuration: '2bhk',
      furnishing: 'semi_furnished',
      amenities: JSON.stringify(['gym', 'parking', 'swimming_pool']),
    });
    
    property2 = await createTestProperty(landlord.id, {
      rent: 35000,
      neighborhood: 'Koramangala',
      configuration: '3bhk',
      furnishing: 'semi_furnished',
      amenities: JSON.stringify(['gym', 'parking']),
    });
  });
  
  afterAll(async () => {
    // Don't close database - it's shared across test files
    // Close Redis only if this is the last test file
  });
  
  describe('GET /api/matches/recommendations', () => {
    it('should return recommendations for authenticated tenant', async () => {
      const response = await request(app)
        .get('/api/matches/recommendations')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toBeDefined();
      expect(Array.isArray(response.body.data.properties)).toBe(true);
    });
    
    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/matches/recommendations')
        .expect(401);
      
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
    
    it('should reject non-tenant users', async () => {
      const response = await request(app)
        .get('/api/matches/recommendations')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(403);
      
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
    
    it('should return remaining swipe count', async () => {
      const response = await request(app)
        .get('/api/matches/recommendations')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
      
      expect(response.body.data.remaining).toBeDefined();
      expect(typeof response.body.data.remaining).toBe('number');
    });
    
    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/matches/recommendations?limit=1')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
      
      expect(response.body.data.properties.length).toBeLessThanOrEqual(1);
    });
  });
  
  describe('POST /api/matches/swipe', () => {
    it('should record right swipe', async () => {
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property1.id,
          direction: 'right',
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Swipe recorded');
      
      // Verify match recorded in database
      const matchResult = await query(
        'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
        [tenant.id, property1.id]
      );
      expect(matchResult.rowCount).toBe(1);
      expect(matchResult.rows[0].tenant_swipe_direction).toBe('right');
    });
    
    it('should record left swipe', async () => {
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property1.id,
          direction: 'left',
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify match recorded as declined
      const matchResult = await query(
        'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
        [tenant.id, property1.id]
      );
      expect(matchResult.rows[0].status).toBe('declined');
    });
    
    it('should record super like', async () => {
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property1.id,
          direction: 'super',
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      const matchResult = await query(
        'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
        [tenant.id, property1.id]
      );
      expect(matchResult.rows[0].tenant_swipe_direction).toBe('super');
    });
    
    it('should reject invalid direction', async () => {
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property1.id,
          direction: 'invalid',
        })
        .expect(400);
      
      expect(response.body.error.code).toBe('INVALID_DIRECTION');
    });
    
    it('should reject missing propertyId', async () => {
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          direction: 'right',
        })
        .expect(400);
      
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
    
    it('should decrement remaining swipes', async () => {
      // First swipe
      const response1 = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property1.id,
          direction: 'right',
        })
        .expect(200);
      
      const remaining1 = response1.body.data.remaining;
      
      // Second swipe
      const response2 = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId: property2.id,
          direction: 'left',
        })
        .expect(200);
      
      const remaining2 = response2.body.data.remaining;
      
      expect(remaining2).toBe(remaining1 - 1);
    });
    
    it('should reject non-tenant users', async () => {
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          propertyId: property1.id,
          direction: 'right',
        })
        .expect(403);
      
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
  
  describe('GET /api/matches/mutual', () => {
    beforeEach(async () => {
      // Create a mutual match
      await query(
        `INSERT INTO matches (tenant_id, property_id, tenant_swipe_direction, landlord_swiped, landlord_swipe_direction, status, match_score)
         VALUES ($1, $2, 'right', true, 'right', 'active', 85)`,
        [tenant.id, property1.id]
      );
    });
    
    it('should return mutual matches for tenant', async () => {
      const response = await request(app)
        .get('/api/matches/mutual')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBeDefined();
      expect(response.body.data.matches.length).toBeGreaterThan(0);
    });
    
    it('should return mutual matches for landlord', async () => {
      const response = await request(app)
        .get('/api/matches/mutual')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBeDefined();
    });
    
    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/matches/mutual')
        .expect(401);
      
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
  
  describe('GET /api/matches/stats', () => {
    beforeEach(async () => {
      // Create some matches for statistics
      await query(
        `INSERT INTO matches (tenant_id, property_id, tenant_swipe_direction, status, match_score)
         VALUES ($1, $2, 'right', 'interested', 80)`,
        [tenant.id, property1.id]
      );
      await query(
        `INSERT INTO matches (tenant_id, property_id, tenant_swipe_direction, status, match_score)
         VALUES ($1, $2, 'left', 'declined', 60)`,
        [tenant.id, property2.id]
      );
    });
    
    it('should return match statistics', async () => {
      const response = await request(app)
        .get('/api/matches/stats')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.rightSwipes).toBeDefined();
      expect(response.body.data.stats.leftSwipes).toBeDefined();
      expect(response.body.data.stats.superLikes).toBeDefined();
      expect(response.body.data.stats.mutualMatches).toBeDefined();
      expect(response.body.data.stats.todayRemaining).toBeDefined();
    });
    
    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/matches/stats')
        .expect(401);
      
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});

describe('Swipe Limit', () => {
  let tenant: any;
  let landlord: any;
  let tenantToken: string;
  let property: any;
  
  beforeAll(async () => {
    // Redis connection should already be open from previous tests
  });
  
  beforeEach(async () => {
    await cleanDatabase();
    
    tenant = await createTestUser({ phone: '9876543210', role: 'tenant' });
    landlord = await createTestUser({ phone: '9876543211', role: 'landlord' });
    
    tenantToken = generateAccessToken({
      userId: tenant.id,
      phone: tenant.phone,
      role: tenant.role,
    });
    
    // Create tenant profile
    await query(
      `INSERT INTO tenant_profiles (user_id, search_type, budget_min, budget_max, preferences)
       VALUES ($1, 'full_home', 10000, 100000, $2)`,
      [
        tenant.id,
        JSON.stringify({
          nonNegotiables: {
            budget: { min: 10000, max: 100000 },
            location: 'Bangalore',
            bhkType: ['1bhk', '2bhk', '3bhk'],
            furnishing: 'any',
            moveInDate: '2026-02-01',
          },
          mustHaves: { amenities: [] },
          niceToHaves: {},
        }),
      ]
    );
    
    property = await createTestProperty(landlord.id, {
      rent: 30000,
      neighborhood: 'Bangalore',
    });
  });
  
  it('should block swipes when daily limit is reached', async () => {
    // Set swipe count to max (50) in database
    await query(
      `INSERT INTO daily_swipe_counts (user_id, swipe_date, swipe_count, super_like_count)
       VALUES ($1, CURRENT_DATE, 50, 0)
       ON CONFLICT (user_id, swipe_date) 
       DO UPDATE SET swipe_count = 50`,
      [tenant.id]
    );
    
    const response = await request(app)
      .post('/api/matches/swipe')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: property.id,
        direction: 'right',
      })
      .expect(429);
    
    expect(response.body.error.code).toBe('SWIPE_LIMIT_REACHED');
  });
  
  it('should block recommendations when daily limit is reached', async () => {
    // Set swipe count to max (50) in database
    await query(
      `INSERT INTO daily_swipe_counts (user_id, swipe_date, swipe_count, super_like_count)
       VALUES ($1, CURRENT_DATE, 50, 0)
       ON CONFLICT (user_id, swipe_date) 
       DO UPDATE SET swipe_count = 50`,
      [tenant.id]
    );
    
    const response = await request(app)
      .get('/api/matches/recommendations')
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(429);
    
    expect(response.body.error.code).toBe('SWIPE_LIMIT_REACHED');
  });
});
