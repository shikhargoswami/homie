import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@homie/shared';
import {
  getTenantSwipeFeed,
  recordLandlordSwipe,
  getPendingSwipeCount,
  declineAllPendingSwipes,
} from '../landlord-swipe.controller';

// Mock the landlord swipe service
jest.mock('../../services/landlord-swipe.service', () => ({
  landlordSwipeService: {
    getTenantSwipeFeed: jest.fn(),
    recordSwipe: jest.fn(),
    getPendingSwipeCount: jest.fn(),
    declineAllPendingForProperty: jest.fn(),
  },
}));

const { landlordSwipeService } = require('../../services/landlord-swipe.service');

describe('Landlord Swipe Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockReq = {
      params: {},
      query: {},
      body: {},
      userId: 'landlord-123',
      userRole: UserRole.LANDLORD,
    };
    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    mockNext = jest.fn() as NextFunction;
  });

  describe('getTenantSwipeFeed', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await getTenantSwipeFeed(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    });

    it('should return 403 when user is not a landlord', async () => {
      mockReq.userRole = UserRole.TENANT;

      await getTenantSwipeFeed(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlords can access tenant swipe feed' },
      });
    });

    it('should return tenant swipe feed successfully', async () => {
      const mockTenants = [
        {
          tenantId: 'tenant-1',
          matchId: 'match-1',
          name: 'Rahul Sharma',
          photo: 'https://example.com/photo1.jpg',
          age: 28,
          workLocationName: 'Manyata Tech Park',
          company: 'Infosys Ltd',
          occupationType: 'it_professional',
          budgetMin: 25000,
          budgetMax: 45000,
          lifestyleTags: ['pet_owner_dog', 'gym_nearby'],
          matchScore: 85,
          matchReason: '85% Match - Works nearby, pet-friendly',
          matchHighlights: ['Works nearby', 'Pet-friendly tenant'],
          property: {
            id: 'prop-1',
            address: '123 MG Road',
            neighborhood: 'Koramangala',
            rent: 35000,
          },
          interestedAt: '2025-01-10T10:00:00Z',
        },
      ];

      (landlordSwipeService.getTenantSwipeFeed as Mock<any>).mockResolvedValueOnce(mockTenants);
      (landlordSwipeService.getPendingSwipeCount as Mock<any>).mockResolvedValueOnce(5);

      await getTenantSwipeFeed(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tenants: mockTenants,
          totalPending: 5,
          count: 1,
        },
      });
    });

    it('should respect limit query parameter', async () => {
      mockReq.query = { limit: '10' };
      
      (landlordSwipeService.getTenantSwipeFeed as Mock<any>).mockResolvedValueOnce([]);
      (landlordSwipeService.getPendingSwipeCount as Mock<any>).mockResolvedValueOnce(0);

      await getTenantSwipeFeed(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(landlordSwipeService.getTenantSwipeFeed).toHaveBeenCalledWith('landlord-123', 10);
    });
  });

  describe('recordLandlordSwipe', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not a landlord', async () => {
      mockReq.userRole = UserRole.TENANT;
      mockReq.body = { matchId: 'match-1', direction: 'right' };

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 when matchId is missing', async () => {
      mockReq.body = { direction: 'right' };

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Match ID is required' },
      });
    });

    it('should return 400 when direction is invalid', async () => {
      mockReq.body = { matchId: 'match-1', direction: 'up' };

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_DIRECTION', message: 'Direction must be "right" or "left"' },
      });
    });

    it('should record right swipe and return mutual match', async () => {
      mockReq.body = { matchId: 'match-1', direction: 'right' };
      
      (landlordSwipeService.recordSwipe as Mock<any>).mockResolvedValueOnce({
        success: true,
        isMutualMatch: true,
        matchId: 'match-1',
        chatUnlocked: true,
        message: "It's a match! You can now chat with this tenant.",
      });

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          matchId: 'match-1',
          isMutualMatch: true,
          chatUnlocked: true,
          message: "It's a match! You can now chat with this tenant.",
        },
      });
    });

    it('should record left swipe (decline)', async () => {
      mockReq.body = { matchId: 'match-1', direction: 'left' };
      
      (landlordSwipeService.recordSwipe as Mock<any>).mockResolvedValueOnce({
        success: true,
        isMutualMatch: false,
        matchId: 'match-1',
        message: 'Tenant declined.',
      });

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          matchId: 'match-1',
          isMutualMatch: false,
          chatUnlocked: undefined,
          message: 'Tenant declined.',
        },
      });
    });

    it('should return 400 when swipe fails', async () => {
      mockReq.body = { matchId: 'match-1', direction: 'right' };
      
      (landlordSwipeService.recordSwipe as Mock<any>).mockResolvedValueOnce({
        success: false,
        isMutualMatch: false,
        matchId: 'match-1',
        message: 'You have already responded to this match',
      });

      await recordLandlordSwipe(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'SWIPE_FAILED', message: 'You have already responded to this match' },
      });
    });
  });

  describe('getPendingSwipeCount', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await getPendingSwipeCount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not a landlord', async () => {
      mockReq.userRole = UserRole.TENANT;

      await getPendingSwipeCount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return pending swipe count', async () => {
      (landlordSwipeService.getPendingSwipeCount as Mock<any>).mockResolvedValueOnce(12);

      await getPendingSwipeCount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          pendingCount: 12,
        },
      });
    });
  });

  describe('declineAllPendingSwipes', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;
      mockReq.params = { propertyId: 'prop-1' };

      await declineAllPendingSwipes(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not a landlord', async () => {
      mockReq.userRole = UserRole.TENANT;
      mockReq.params = { propertyId: 'prop-1' };

      await declineAllPendingSwipes(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 when propertyId is missing', async () => {
      mockReq.params = {};

      await declineAllPendingSwipes(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Property ID is required' },
      });
    });

    it('should decline all pending swipes for property', async () => {
      mockReq.params = { propertyId: 'prop-1' };
      
      (landlordSwipeService.declineAllPendingForProperty as Mock<any>).mockResolvedValueOnce(5);

      await declineAllPendingSwipes(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          declinedCount: 5,
          message: 'Declined 5 pending tenant interest(s)',
        },
      });
    });
  });
});
