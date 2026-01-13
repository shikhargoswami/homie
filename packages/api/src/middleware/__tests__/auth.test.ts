import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import app from '../../index';
import { cleanDatabase, createTestUser, closeDatabase } from '../../test/db-helper';
import { redisClient } from '../../database/client';
import { generateAccessToken, generateRefreshToken } from '../../services/token.service';
import { UserRole } from '@homie/shared';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let testUser: any;
  let validToken: string;
  
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  
  beforeEach(async () => {
    await cleanDatabase();
    
    // Clear blacklist
    const keys = await redisClient.keys('token:blacklist:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    testUser = await createTestUser({ phone: '9876543210', role: 'tenant' });
    validToken = generateAccessToken({
      userId: testUser.id,
      phone: testUser.phone,
      role: testUser.role,
    });
  });
  
  afterAll(async () => {
    // Don't close database - it's shared across test files
  });
  
  describe('authenticate middleware', () => {
    it('should pass with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);
      
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
    
    it('should reject request without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', validToken)
        .expect(401);
      
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
    
    it('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
    
    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        {
          userId: testUser.id,
          phone: testUser.phone,
          role: testUser.role,
        },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1s' } // Already expired
      );
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
    
    it('should reject blacklisted token', async () => {
      // Blacklist the token
      await redisClient.setEx(`token:blacklist:${validToken}`, 86400, 'true');
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);
      
      expect(response.body.error.code).toBe('TOKEN_REVOKED');
    });
    
    it('should reject token for deleted user', async () => {
      // Delete user but keep token
      const { query } = await import('../../database/client');
      await query('DELETE FROM users WHERE id = $1', [testUser.id]);
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);
      
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
  
  describe('authorize middleware', () => {
    it('should allow tenant to access tenant routes', async () => {
      // Create tenant profile for recommendations endpoint
      const { query } = await import('../../database/client');
      await query(
        `INSERT INTO tenant_profiles (user_id, search_type, budget_min, budget_max, preferences)
         VALUES ($1, 'full_home', 20000, 50000, $2)`,
        [
          testUser.id,
          JSON.stringify({
            nonNegotiables: {
              budget: { min: 20000, max: 50000 },
              location: 'Test',
              bhkType: ['2bhk'],
              furnishing: 'any',
              moveInDate: '2026-02-01',
            },
            mustHaves: { amenities: [] },
            niceToHaves: {},
          }),
        ]
      );
      
      // Clear recommendations cache
      const keys = await redisClient.keys('recommendations:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      const response = await request(app)
        .get('/api/matches/recommendations')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should deny landlord access to tenant routes', async () => {
      const landlord = await createTestUser({ phone: '9876543211', role: 'landlord' });
      const landlordToken = generateAccessToken({
        userId: landlord.id,
        phone: landlord.phone,
        role: landlord.role,
      });
      
      const response = await request(app)
        .get('/api/matches/recommendations')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(403);
      
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
    
    it('should deny tenant access to swipe when using landlord token', async () => {
      const landlord = await createTestUser({ phone: '9876543211', role: 'landlord' });
      const landlordToken = generateAccessToken({
        userId: landlord.id,
        phone: landlord.phone,
        role: landlord.role,
      });
      
      const response = await request(app)
        .post('/api/matches/swipe')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ propertyId: 'some-id', direction: 'right' })
        .expect(403);
      
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});

describe('Token Service', () => {
  it('should generate valid access token', () => {
    const payload = {
      userId: 'test-user-id',
      phone: '9876543210',
      role: UserRole.TENANT,
    };
    
    const token = generateAccessToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    
    // Verify token can be decoded
    const decoded = jwt.decode(token) as any;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.phone).toBe(payload.phone);
    expect(decoded.role).toBe(payload.role);
  });
  
  it('should generate valid refresh token', () => {
    const payload = {
      userId: 'test-user-id',
      phone: '9876543210',
      role: UserRole.TENANT,
    };
    
    const token = generateRefreshToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });
  
  it('should generate different tokens for same payload', async () => {
    const payload = {
      userId: 'test-user-id',
      phone: '9876543210',
      role: UserRole.TENANT,
    };
    
    const token1 = generateAccessToken(payload);
    
    // Add small delay to ensure different iat (1 second to guarantee different timestamp)
    await new Promise(resolve => setTimeout(resolve, 1100));
    const token2 = generateAccessToken(payload);
    
    // Tokens have same payload but different timestamps
    expect(token1).not.toBe(token2);
  });
});
