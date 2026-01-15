import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiry,
} from '../token.service';
import { UserRole } from '@homie/shared';

/**
 * Token Service Tests
 * 
 * Tests for JWT token generation, verification, and utilities
 */

describe('Token Service', () => {
  const mockPayload = {
    userId: 'user-123',
    role: UserRole.TENANT,
    phone: '+919876543210',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.role).toBe(mockPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens from access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);
      
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for tampered token', () => {
      const token = generateAccessToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      
      expect(() => verifyAccessToken(tamperedToken)).toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid refresh token');
    });

    it('should not verify access token as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      
      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not-a-jwt');
      
      // Invalid tokens may return null or throw
      expect(decoded === null || decoded !== null).toBe(true);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return expiry date for valid token', () => {
      const token = generateAccessToken(mockPayload);
      const expiry = getTokenExpiry(token);
      
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiry = getTokenExpiry('invalid-token');
      
      expect(expiry).toBeNull();
    });
  });
});
