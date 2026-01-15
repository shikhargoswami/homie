/**
 * Landlord Verification Controller Tests
 * 
 * Integration tests for landlord verification API endpoints
 */

import request from 'supertest';
import express from 'express';
import {
  getVerificationStatus,
  sendEmailVerification,
  verifyEmailOtp,
  submitIdVerification,
  submitPropertyDocuments,
  skipVerification,
  getVerificationBadges,
} from '../landlord-verification.controller';
import { landlordVerificationService, VerificationStatus } from '../../services/landlord-verification.service';

// Mock the verification service
jest.mock('../../services/landlord-verification.service', () => ({
  landlordVerificationService: {
    getVerificationStatus: jest.fn(),
    sendEmailVerificationOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    submitIdVerification: jest.fn(),
    submitPropertyDocuments: jest.fn(),
    skipVerification: jest.fn(),
    getVerificationBadges: jest.fn(),
  },
}));

const mockService = landlordVerificationService as jest.Mocked<typeof landlordVerificationService>;

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((req, _res, next) => {
    req.userId = 'test-landlord-id';
    next();
  });
  
  // Mount routes
  app.get('/api/landlord/verification/status', getVerificationStatus);
  app.post('/api/landlord/verification/email/send', sendEmailVerification);
  app.post('/api/landlord/verification/email/verify', verifyEmailOtp);
  app.post('/api/landlord/verification/id', submitIdVerification);
  app.post('/api/landlord/verification/property-docs', submitPropertyDocuments);
  app.post('/api/landlord/verification/skip', skipVerification);
  app.get('/api/landlord/verification/badges', getVerificationBadges);
  
  return app;
};

describe('Landlord Verification Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/landlord/verification/status', () => {
    it('should return verification status', async () => {
      const mockStatus: VerificationStatus = {
        phoneVerified: true,
        emailVerified: false,
        idVerified: false,
        propertyOwnershipVerified: false,
        verificationLevel: 'basic' as const,
        trustScore: 20,
        verificationSkipped: false,
      };
      mockService.getVerificationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/landlord/verification/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verification).toEqual(mockStatus);
    });

    it('should return 404 for non-existent profile', async () => {
      mockService.getVerificationStatus.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/landlord/verification/status')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/landlord/verification/email/send', () => {
    it('should send verification email', async () => {
      mockService.sendEmailVerificationOtp.mockResolvedValue({
        success: true,
        message: 'Verification email sent',
      });

      const response = await request(app)
        .post('/api/landlord/verification/email/send')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Verification email sent');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/landlord/verification/email/send')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for rate limiting', async () => {
      mockService.sendEmailVerificationOtp.mockResolvedValue({
        success: false,
        message: 'Too many verification attempts',
      });

      const response = await request(app)
        .post('/api/landlord/verification/email/send')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VERIFICATION_ERROR');
    });
  });

  describe('POST /api/landlord/verification/email/verify', () => {
    it('should verify email OTP', async () => {
      mockService.verifyEmailOtp.mockResolvedValue({
        success: true,
        message: 'Email verified successfully',
      });
      mockService.getVerificationStatus.mockResolvedValue({
        phoneVerified: true,
        emailVerified: true,
        idVerified: false,
        propertyOwnershipVerified: false,
        verificationLevel: 'basic' as const,
        trustScore: 35,
        verificationSkipped: false,
      });

      const response = await request(app)
        .post('/api/landlord/verification/email/verify')
        .send({ otp: '123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verification.emailVerified).toBe(true);
    });

    it('should return 400 for missing OTP', async () => {
      const response = await request(app)
        .post('/api/landlord/verification/email/verify')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid OTP', async () => {
      mockService.verifyEmailOtp.mockResolvedValue({
        success: false,
        message: 'Invalid OTP',
      });

      const response = await request(app)
        .post('/api/landlord/verification/email/verify')
        .send({ otp: '999999' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid OTP');
    });
  });

  describe('POST /api/landlord/verification/id', () => {
    it('should submit Aadhar verification', async () => {
      mockService.submitIdVerification.mockResolvedValue({
        success: true,
        message: 'ID verification submitted successfully',
        verificationId: 'verify-123',
      });
      mockService.getVerificationStatus.mockResolvedValue({
        phoneVerified: true,
        emailVerified: true,
        idVerified: true,
        propertyOwnershipVerified: false,
        verificationLevel: 'verified' as const,
        trustScore: 65,
        verificationSkipped: false,
      });

      const response = await request(app)
        .post('/api/landlord/verification/id')
        .send({
          documentType: 'aadhar',
          documentNumber: '123456789012',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verificationId).toBe('verify-123');
    });

    it('should submit PAN verification', async () => {
      mockService.submitIdVerification.mockResolvedValue({
        success: true,
        message: 'ID verification submitted successfully',
        verificationId: 'verify-456',
      });
      mockService.getVerificationStatus.mockResolvedValue({
        phoneVerified: true,
        emailVerified: true,
        idVerified: true,
        propertyOwnershipVerified: false,
        verificationLevel: 'verified' as const,
        trustScore: 65,
        verificationSkipped: false,
      });

      const response = await request(app)
        .post('/api/landlord/verification/id')
        .send({
          documentType: 'pan',
          documentNumber: 'ABCDE1234F',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing document type', async () => {
      const response = await request(app)
        .post('/api/landlord/verification/id')
        .send({ documentNumber: '123456789012' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid document type', async () => {
      const response = await request(app)
        .post('/api/landlord/verification/id')
        .send({
          documentType: 'invalid_type',
          documentNumber: '123456789012',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid document type');
    });
  });

  describe('POST /api/landlord/verification/property-docs', () => {
    it('should submit property documents', async () => {
      mockService.submitPropertyDocuments.mockResolvedValue({
        success: true,
        message: 'Property documents submitted for verification',
      });
      mockService.getVerificationStatus.mockResolvedValue({
        phoneVerified: true,
        emailVerified: true,
        idVerified: true,
        propertyOwnershipVerified: true,
        verificationLevel: 'premium' as const,
        trustScore: 90,
        verificationSkipped: false,
      });

      const response = await request(app)
        .post('/api/landlord/verification/property-docs')
        .send({
          documentUrls: ['https://example.com/doc1.pdf'],
          documentType: 'sale_deed',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verification.propertyOwnershipVerified).toBe(true);
    });

    it('should return 400 for missing documents', async () => {
      const response = await request(app)
        .post('/api/landlord/verification/property-docs')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty document array', async () => {
      const response = await request(app)
        .post('/api/landlord/verification/property-docs')
        .send({ documentUrls: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/landlord/verification/skip', () => {
    it('should skip verification', async () => {
      mockService.skipVerification.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/landlord/verification/skip')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('skipped');
    });
  });

  describe('GET /api/landlord/verification/badges', () => {
    it('should return verification badges', async () => {
      mockService.getVerificationBadges.mockResolvedValue([
        'Phone Verified',
        'Email Verified',
        'ID Verified',
        'Trusted Landlord',
      ]);

      const response = await request(app)
        .get('/api/landlord/verification/badges')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.badges).toContain('Phone Verified');
      expect(response.body.data.badges).toContain('Trusted Landlord');
    });

    it('should return empty badges for new landlord', async () => {
      mockService.getVerificationBadges.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/landlord/verification/badges')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.badges).toEqual([]);
    });
  });
});
