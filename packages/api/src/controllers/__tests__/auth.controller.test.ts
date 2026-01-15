import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import app from '../../index';
import { cleanDatabase, createTestUser, closeDatabase } from '../../test/db-helper';
import { redisClient } from '../../database/client';
import { generateAccessToken } from '../../services/token.service';

describe('Auth Controller', () => {
  beforeAll(async () => {
    // Connect Redis for tests
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  
  beforeEach(async () => {
    await cleanDatabase();
    // Clear Redis test keys
    const keys = await redisClient.keys('otp:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });
  
  afterAll(async () => {
    await closeDatabase();
    await redisClient.quit();
  });
  
  describe('POST /api/auth/request-otp', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '9876543210' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('OTP sent');
      
      // Verify OTP stored in Redis
      const otp = await redisClient.get('otp:9876543210');
      expect(otp).toBeTruthy();
      expect(otp?.length).toBe(6);
    });
    
    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({ phone: '1234567890' }) // Starts with 1, invalid
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
    });
    
    it('should enforce rate limiting', async () => {
      const phone = '9876543299'; // Use unique phone to avoid conflicts
      
      // In test mode, rate limit is 50 requests per hour
      // Set the rate limit counter to 49 in Redis, then the next request should trigger 429
      const cleanPhone = phone.replace(/\D/g, '');
      const rateLimitKey = `otp:ratelimit:${cleanPhone}`;
      await redisClient.setEx(rateLimitKey, 3600, '50'); // Set at limit
      
      // This request should be rate limited
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({ phone })
        .expect(429);
      
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
  
  describe('POST /api/auth/verify-otp', () => {
    it('should verify correct OTP and return tokens', async () => {
      const phone = '9876543210';
      const otp = '123456';
      
      // Store OTP in Redis
      await redisClient.setEx(`otp:${phone}`, 600, otp);
      await redisClient.setEx(`otp:attempts:${phone}`, 600, '0');
      
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      
      // Verify OTP deleted from Redis
      const storedOTP = await redisClient.get(`otp:${phone}`);
      expect(storedOTP).toBeNull();
    });
    
    it('should reject incorrect OTP', async () => {
      const phone = '9876543210';
      
      await redisClient.setEx(`otp:${phone}`, 600, '123456');
      await redisClient.setEx(`otp:attempts:${phone}`, 600, '0');
      
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp: '999999' }) // Wrong OTP
        .expect(400);
      
      expect(response.body.error.code).toBe('INVALID_OTP');
    });
    
    it('should enforce max attempts', async () => {
      const phone = '9876543210';
      
      await redisClient.setEx(`otp:${phone}`, 600, '123456');
      await redisClient.setEx(`otp:attempts:${phone}`, 600, '0');
      
      // Try wrong OTP 3 times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({ phone, otp: '999999' })
          .expect(400);
      }
      
      // 4th attempt should fail with max attempts error
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp: '999999' })
        .expect(400);
      
      expect(response.body.error.code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should return current user for authenticated request', async () => {
      const user = await createTestUser({ phone: '9876543210' });
      const token = generateAccessToken({
        userId: user.id,
        phone: user.phone,
        role: user.role,
      });
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
    });
    
    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);
      
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should logout and blacklist token', async () => {
      const user = await createTestUser({ phone: '9876543210' });
      const token = generateAccessToken({
        userId: user.id,
        phone: user.phone,
        role: user.role,
      });
      
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Verify token blacklisted
      const blacklisted = await redisClient.exists(`token:blacklist:${token}`);
      expect(blacklisted).toBe(1);
      
      // Try using blacklisted token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(response.body.error.code).toBe('TOKEN_REVOKED');
    });
  });
});
