/**
 * Landlord Verification Service Tests
 * 
 * Tests for landlord verification functionality:
 * - Get verification status
 * - Email verification (send OTP, verify OTP)
 * - ID verification (Aadhar/PAN)
 * - Property document verification
 * - Trust score calculation
 * - Skip verification
 */

import { landlordVerificationService } from '../landlord-verification.service';
import { query, redisClient } from '../../database/client';

// Mock database and redis
jest.mock('../../database/client', () => ({
  query: jest.fn(),
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  },
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

describe('LandlordVerificationService', () => {
  const mockLandlordId = 'landlord-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for a landlord', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          phone_verified: true,
          email_verified: true,
          email_verified_at: new Date('2026-01-15'),
          id_verified: false,
          id_verified_at: null,
          id_document_type: null,
          property_ownership_verified: false,
          property_ownership_verified_at: null,
          verification_level: 'verified',
          trust_score: 35,
          verification_skipped: false,
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const status = await landlordVerificationService.getVerificationStatus(mockLandlordId);

      expect(status).toBeDefined();
      expect(status?.phoneVerified).toBe(true);
      expect(status?.emailVerified).toBe(true);
      expect(status?.idVerified).toBe(false);
      expect(status?.verificationLevel).toBe('verified');
      expect(status?.trustScore).toBe(35);
    });

    it('should return null for non-existent landlord', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const status = await landlordVerificationService.getVerificationStatus('non-existent');

      expect(status).toBeNull();
    });

    it('should handle missing fields gracefully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{}], // Empty row
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const status = await landlordVerificationService.getVerificationStatus(mockLandlordId);

      expect(status?.phoneVerified).toBe(true); // Default
      expect(status?.emailVerified).toBe(false); // Default
      expect(status?.verificationLevel).toBe('basic'); // Default
      expect(status?.trustScore).toBe(0); // Default
    });
  });

  describe('sendEmailVerificationOtp', () => {
    it('should send OTP for valid email', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // No rate limit
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: mockLandlordId }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await landlordVerificationService.sendEmailVerificationOtp({
        email: 'test@example.com',
        landlordId: mockLandlordId,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Verification email sent');
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      const result = await landlordVerificationService.sendEmailVerificationOtp({
        email: 'invalid-email',
        landlordId: mockLandlordId,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });

    it('should enforce rate limiting', async () => {
      mockRedis.get.mockResolvedValueOnce('3'); // Max attempts reached

      const result = await landlordVerificationService.sendEmailVerificationOtp({
        email: 'test@example.com',
        landlordId: mockLandlordId,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Too many verification attempts');
    });
  });

  describe('verifyEmailOtp', () => {
    it('should verify correct OTP', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        otp: '123456',
        email: 'test@example.com',
      }));
      mockQuery.mockResolvedValue({
        rows: [{ phone_verified: true, email_verified: true, created_at: new Date() }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await landlordVerificationService.verifyEmailOtp(mockLandlordId, '123456');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should reject incorrect OTP', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        otp: '123456',
        email: 'test@example.com',
      }));

      const result = await landlordVerificationService.verifyEmailOtp(mockLandlordId, '999999');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // No OTP found

      const result = await landlordVerificationService.verifyEmailOtp(mockLandlordId, '123456');

      expect(result.success).toBe(false);
      expect(result.message).toContain('OTP expired');
    });
  });

  describe('submitIdVerification', () => {
    it('should verify valid Aadhar number', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ phone_verified: true, id_verified: true, created_at: new Date() }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await landlordVerificationService.submitIdVerification({
        landlordId: mockLandlordId,
        documentType: 'aadhar',
        documentNumber: '123456789012', // 12 digits
      });

      expect(result.success).toBe(true);
      expect(result.verificationId).toBeDefined();
    });

    it('should verify valid PAN number', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ phone_verified: true, id_verified: true, created_at: new Date() }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await landlordVerificationService.submitIdVerification({
        landlordId: mockLandlordId,
        documentType: 'pan',
        documentNumber: 'ABCDE1234F', // Valid PAN format
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid Aadhar number', async () => {
      const result = await landlordVerificationService.submitIdVerification({
        landlordId: mockLandlordId,
        documentType: 'aadhar',
        documentNumber: '12345', // Too short
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid AADHAR number');
    });

    it('should reject invalid PAN number', async () => {
      const result = await landlordVerificationService.submitIdVerification({
        landlordId: mockLandlordId,
        documentType: 'pan',
        documentNumber: '12345ABCD', // Invalid format
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid PAN number');
    });
  });

  describe('submitPropertyDocuments', () => {
    it('should submit property documents successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ phone_verified: true, property_ownership_verified: true, created_at: new Date() }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await landlordVerificationService.submitPropertyDocuments({
        landlordId: mockLandlordId,
        documentUrls: ['https://example.com/doc1.pdf'],
        documentType: 'sale_deed',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('submitted');
    });

    it('should reject empty document list', async () => {
      const result = await landlordVerificationService.submitPropertyDocuments({
        landlordId: mockLandlordId,
        documentUrls: [],
        documentType: 'sale_deed',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('No documents provided');
    });
  });

  describe('skipVerification', () => {
    it('should mark verification as skipped', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: mockLandlordId }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await landlordVerificationService.skipVerification(mockLandlordId);

      expect(result.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('verification_skipped = true'),
        [mockLandlordId]
      );
    });
  });

  describe('getVerificationBadges', () => {
    it('should return badges for fully verified landlord', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          phone_verified: true,
          email_verified: true,
          id_verified: true,
          property_ownership_verified: true,
          verification_level: 'trusted',
          trust_score: 95,
          verification_skipped: false,
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const badges = await landlordVerificationService.getVerificationBadges(mockLandlordId);

      expect(badges).toContain('Phone Verified');
      expect(badges).toContain('Email Verified');
      expect(badges).toContain('ID Verified');
      expect(badges).toContain('Verified Owner');
      expect(badges).toContain('Trusted Landlord');
    });

    it('should return empty array for non-existent landlord', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const badges = await landlordVerificationService.getVerificationBadges('non-existent');

      expect(badges).toEqual([]);
    });
  });

  describe('Trust Score Calculation', () => {
    it('should calculate correct trust score', async () => {
      // Mock the initial query for updateTrustScoreAndLevel
      mockQuery.mockResolvedValueOnce({
        rows: [{
          phone_verified: true, // 20 points
          email_verified: true, // 15 points
          id_verified: true, // 30 points
          property_ownership_verified: false, // 0 points
          created_at: new Date('2025-01-15'), // 12 months = 10 points (capped)
          rating: 4.5,
          rating_count: 10, // 5 bonus points
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });
      // Mock the update query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: mockLandlordId }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Call updateTrustScoreAndLevel through a verification action
      await (landlordVerificationService as any).updateTrustScoreAndLevel(mockLandlordId);

      // Should have called update with calculated score
      // 20 (phone) + 15 (email) + 30 (id) + 0 (property) + 10 (age) + 5 (rating) = 80
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('trust_score = $2'),
        [mockLandlordId, 80, 'premium'] // 80 is in premium range (66-90)
      );
    });
  });
});
