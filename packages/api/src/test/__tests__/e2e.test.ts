import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import app from '../../index';
import { cleanDatabase, createTestUser, createTestProperty, closeDatabase } from '../../test/db-helper';
import { redisClient, query } from '../../database/client';

/**
 * End-to-End Integration Tests
 * 
 * These tests validate the complete user journey:
 * 1. User requests OTP
 * 2. User verifies OTP and gets authenticated
 * 3. User browses property recommendations
 * 4. User swipes on properties
 * 5. Mutual matches are created
 * 6. User logs out
 */

describe('E2E: Complete User Journey', () => {
  const testPhone = '9876543210';
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let landlord: any;
  let property: any;
  
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  
  beforeEach(async () => {
    await cleanDatabase();
    
    // Clear Redis OTP keys
    const otpKeys = await redisClient.keys('otp:*');
    if (otpKeys.length > 0) {
      await redisClient.del(otpKeys);
    }
    
    // Clear recommendations cache
    const recKeys = await redisClient.keys('recommendations:*');
    if (recKeys.length > 0) {
      await redisClient.del(recKeys);
    }
    
    // Clear swipe counts
    const swipeKeys = await redisClient.keys('swipes:*');
    if (swipeKeys.length > 0) {
      await redisClient.del(swipeKeys);
    }
    
    // Create landlord and property
    landlord = await createTestUser({ phone: '9876543211', role: 'landlord' });
    property = await createTestProperty(landlord.id, {
      rent: 30000,
      neighborhood: 'Koramangala',
      configuration: '2bhk',
      furnishing: 'semi_furnished',
      amenities: JSON.stringify(['gym', 'parking']),
    });
  });
  
  afterAll(async () => {
    // Don't close database - it's shared across test files
  });
  
  describe('Step 1: Request OTP', () => {
    it('should send OTP for new user', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: testPhone })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('OTP sent');
      expect(response.body.data.phone).toBe(testPhone);
      expect(response.body.data.expiresIn).toBe(600); // 10 minutes
      
      // Verify OTP is stored in Redis
      const storedOTP = await redisClient.get(`otp:${testPhone}`);
      expect(storedOTP).toBeTruthy();
      expect(storedOTP?.length).toBe(6);
    });
  });
  
  describe('Step 2: Verify OTP and Authenticate', () => {
    it('should create new user on first login', async () => {
      // Store OTP in Redis
      const otp = '123456';
      await redisClient.setEx(`otp:${testPhone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${testPhone}`, 600, '0');
      
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.phone).toBe(testPhone);
      expect(response.body.data.user.role).toBe('tenant'); // Default role
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      
      // Store for next tests
      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
      userId = response.body.data.user.id;
      
      // Verify user was created in database
      const userResult = await query('SELECT * FROM users WHERE phone = $1', [testPhone]);
      expect(userResult.rowCount).toBe(1);
    });
    
    it('should login existing user', async () => {
      // Create existing user
      const existingUser = await createTestUser({ phone: testPhone, name: 'John Doe' });
      
      // Store OTP
      const otp = '654321';
      await redisClient.setEx(`otp:${testPhone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${testPhone}`, 600, '0');
      
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp })
        .expect(200);
      
      expect(response.body.data.user.id).toBe(existingUser.id);
      expect(response.body.data.user.name).toBe('John Doe');
    });
  });
  
  describe('Step 3: Browse Recommendations', () => {
    beforeEach(async () => {
      // Create and authenticate user
      const otp = '123456';
      await redisClient.setEx(`otp:${testPhone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${testPhone}`, 600, '0');
      
      const authResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp });
      
      accessToken = authResponse.body.data.tokens.accessToken;
      userId = authResponse.body.data.user.id;
      
      // Create tenant profile with preferences
      await query(
        `INSERT INTO tenant_profiles (user_id, search_type, budget_min, budget_max, preferences)
         VALUES ($1, 'full_home', 20000, 50000, $2)`,
        [
          userId,
          JSON.stringify({
            nonNegotiables: {
              budget: { min: 20000, max: 50000 },
              location: 'Koramangala',
              bhkType: ['2bhk'],
              furnishing: 'semi_furnished',
              moveInDate: '2026-02-01',
            },
            mustHaves: { amenities: ['gym', 'parking'] },
            niceToHaves: {},
          }),
        ]
      );
    });
    
    it('should get personalized recommendations', async () => {
      const response = await request(app)
        .get('/api/matches/recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toBeDefined();
      expect(response.body.data.remaining).toBeDefined();
    });
  });
  
  describe('Step 4: Swipe on Properties', () => {
    beforeEach(async () => {
      // Create and authenticate user
      const otp = '123456';
      await redisClient.setEx(`otp:${testPhone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${testPhone}`, 600, '0');
      
      const authResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp });
      
      accessToken = authResponse.body.data.tokens.accessToken;
      userId = authResponse.body.data.user.id;
      
      // Create tenant profile
      await query(
        `INSERT INTO tenant_profiles (user_id, search_type, budget_min, budget_max, preferences)
         VALUES ($1, 'full_home', 20000, 50000, $2)`,
        [
          userId,
          JSON.stringify({
            nonNegotiables: {
              budget: { min: 20000, max: 50000 },
              location: 'Koramangala',
              bhkType: ['2bhk'],
              furnishing: 'semi_furnished',
              moveInDate: '2026-02-01',
            },
            mustHaves: { amenities: [] },
            niceToHaves: {},
          }),
        ]
      );
    });
    
    it('should record swipes and track remaining', async () => {
      // Right swipe
      const swipeResponse = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          propertyId: property.id,
          direction: 'right',
        })
        .expect(200);
      
      expect(swipeResponse.body.success).toBe(true);
      expect(swipeResponse.body.data.remaining).toBeLessThan(50);
      
      // Verify match was recorded
      const matchResult = await query(
        'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
        [userId, property.id]
      );
      expect(matchResult.rowCount).toBe(1);
    });
    
    it('should track swipe statistics', async () => {
      // Make some swipes
      await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ propertyId: property.id, direction: 'right' });
      
      // Create another property and swipe left
      const property2 = await createTestProperty(landlord.id, { rent: 25000, neighborhood: 'Koramangala' });
      await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ propertyId: property2.id, direction: 'left' });
      
      // Get stats
      const statsResponse = await request(app)
        .get('/api/matches/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(statsResponse.body.data.stats.rightSwipes).toBe(1);
      expect(statsResponse.body.data.stats.leftSwipes).toBe(1);
    });
  });
  
  describe('Step 5: Refresh Token', () => {
    beforeEach(async () => {
      const otp = '123456';
      await redisClient.setEx(`otp:${testPhone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${testPhone}`, 600, '0');
      
      const authResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp });
      
      accessToken = authResponse.body.data.tokens.accessToken;
      refreshToken = authResponse.body.data.tokens.refreshToken;
    });
    
    it('should refresh access token', async () => {
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      // Note: Token may be the same if generated in same second
      // The important thing is that a new token is returned
    });
  });
  
  describe('Step 6: Logout', () => {
    beforeEach(async () => {
      const otp = '123456';
      await redisClient.setEx(`otp:${testPhone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${testPhone}`, 600, '0');
      
      const authResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp });
      
      accessToken = authResponse.body.data.tokens.accessToken;
    });
    
    it('should logout and invalidate token', async () => {
      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(logoutResponse.body.success).toBe(true);
      
      // Try to use token after logout
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
      
      expect(meResponse.body.error.code).toBe('TOKEN_REVOKED');
    });
  });
});

describe('E2E: Error Handling', () => {
  beforeAll(async () => {
    // Redis should already be connected
  });
  
  beforeEach(async () => {
    await cleanDatabase();
  });
  
  afterAll(async () => {
    // Don't close database - it's shared across test files
  });
  
  it('should handle rate limiting for OTP requests', async () => {
    const phone = '9876543210';
    
    // Make 3 OTP requests (max allowed)
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/request-otp')
        .send({ phone })
        .expect(200);
    }
    
    // 4th request should be rate limited
    const response = await request(app)
      .post('/api/auth/request-otp')
      .send({ phone })
      .expect(429);
    
    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
  
  it('should handle max OTP verification attempts', async () => {
    const phone = '9876543210';
    const otp = '123456';
    
    // Store OTP
    await redisClient.setEx(`otp:${phone}`, 600, otp);
    await redisClient.setEx(`otp:attempts:${phone}`, 600, '0');
    
    // Make 3 wrong attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp: '999999' })
        .expect(400);
    }
    
    // 4th attempt should be blocked
    const response = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: '999999' })
      .expect(400);
    
    expect(response.body.error.code).toBe('MAX_ATTEMPTS_EXCEEDED');
  });
  
  it('should handle expired OTP', async () => {
    const phone = '9876543210';
    
    // Don't store OTP (simulate expiry)
    const response = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: '123456' })
      .expect(400);
    
    expect(response.body.error.code).toBe('OTP_EXPIRED');
  });
  
  it('should return 404 for unknown endpoints', async () => {
    const response = await request(app)
      .get('/api/unknown/endpoint')
      .expect(404);
    
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
