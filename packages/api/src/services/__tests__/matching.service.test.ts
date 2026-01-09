import { matchingService } from '../matching.service';
import { cleanDatabase, createTestUser, createTestProperty, closeDatabase } from '../../test/db-helper';
import { query } from '../../database/client';
import { redisClient } from '../../database/client';

describe('Matching Service', () => {
  let tenant: any;
  let landlord: any;
  let property1: any;
  let property2: any;
  
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  
  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test data
    tenant = await createTestUser({ phone: '9876543210', role: 'tenant' });
    landlord = await createTestUser({ phone: '9876543211', role: 'landlord' });
    
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
      rent: 50000, // Outside budget
      neighborhood: 'Koramangala',
      configuration: '3bhk',
      furnishing: 'fully_furnished',
      amenities: JSON.stringify(['gym']),
    });
  });
  
  afterAll(async () => {
    await closeDatabase();
    await redisClient.quit();
  });
  
  describe('getRecommendations()', () => {
    it('should return matching properties', async () => {
      const recommendations = await matchingService.getRecommendations(tenant.id, 10);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('propertyId');
      expect(recommendations[0]).toHaveProperty('matchScore');
      expect(recommendations[0]).toHaveProperty('matchReason');
    });
    
    it('should filter out properties outside budget', async () => {
      const recommendations = await matchingService.getRecommendations(tenant.id, 10);
      
      // property2 should not be in recommendations (₹50K > ₹40K max budget)
      const property2Match = recommendations.find(r => r.propertyId === property2.id);
      expect(property2Match).toBeUndefined();
    });
    
    it('should prioritize properties with better match score', async () => {
      const recommendations = await matchingService.getRecommendations(tenant.id, 10);
      
      // property1 should have higher score (all amenities + within budget)
      const property1Match = recommendations.find(r => r.propertyId === property1.id);
      
      if (property1Match) {
        expect(property1Match.matchScore).toBeGreaterThan(60);
      }
    });
    
    it('should cache recommendations', async () => {
      // First call
      await matchingService.getRecommendations(tenant.id, 10);
      
      // Check cache
      const cacheKey = `recommendations:${tenant.id}`;
      const cached = await redisClient.get(cacheKey);
      
      expect(cached).toBeTruthy();
    });
  });
  
  describe('recordSwipe()', () => {
    it('should record right swipe', async () => {
      await matchingService.recordSwipe(tenant.id, property1.id, 'right');
      
      const matchResult = await query(
        'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
        [tenant.id, property1.id]
      );
      
      expect(matchResult.rowCount).toBe(1);
      expect(matchResult.rows[0].tenant_swipe_direction).toBe('right');
      expect(matchResult.rows[0].status).toBe('interested');
    });
    
    it('should record left swipe', async () => {
      await matchingService.recordSwipe(tenant.id, property1.id, 'left');
      
      const matchResult = await query(
        'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
        [tenant.id, property1.id]
      );
      
      expect(matchResult.rowCount).toBe(1);
      expect(matchResult.rows[0].tenant_swipe_direction).toBe('left');
      expect(matchResult.rows[0].status).toBe('declined');
    });
    
    it('should increment daily swipe counter', async () => {
      await matchingService.recordSwipe(tenant.id, property1.id, 'right');
      
      const swipeLimit = await matchingService.checkSwipeLimit(tenant.id);
      expect(swipeLimit.remaining).toBe(49); // 50 - 1
    });
  });
  
  describe('checkSwipeLimit()', () => {
    it('should allow swipes under limit', async () => {
      const result = await matchingService.checkSwipeLimit(tenant.id);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
    });
    
    it('should block swipes at limit', async () => {
      // Simulate 50 swipes
      const swipeCountKey = `swipes:daily:${tenant.id}:${new Date().toISOString().split('T')[0]}`;
      await redisClient.set(swipeCountKey, '50');
      
      const result = await matchingService.checkSwipeLimit(tenant.id);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
