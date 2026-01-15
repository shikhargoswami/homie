import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { Request, Response, NextFunction } from 'express';
import {
  scheduleViewing,
  getTenantViewings,
  getLandlordViewings,
  confirmViewing,
  cancelViewing,
} from '../viewing.controller';

// Mock the database client
jest.mock('../../database/client', () => ({
  query: jest.fn(),
}));

const { query } = require('../../database/client');
const mockQuery = query as Mock<any>;

describe('Viewing Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      userId: 'test-user-id',
    };
    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    mockNext = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  describe('scheduleViewing', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await scheduleViewing(
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

    it('should return 400 when required fields are missing', async () => {
      mockReq.body = { propertyId: 'property-1' }; // Missing proposedDatetime

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Property ID and proposed datetime are required' },
      });
    });

    it('should return 400 when datetime is in the past', async () => {
      mockReq.body = {
        propertyId: 'property-1',
        proposedDatetime: '2020-01-15T10:00:00.000Z', // Past date
      };

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Proposed datetime must be in the future' },
      });
    });

    it('should return 404 when property not found', async () => {
      mockReq.body = {
        propertyId: 'non-existent',
        proposedDatetime: '2030-01-15T10:00:00.000Z', // Future date
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found or not available' },
      });
    });

    it('should return 409 when there is an existing active viewing', async () => {
      mockReq.body = {
        propertyId: 'property-1',
        proposedDatetime: '2030-01-15T10:00:00.000Z',
      };
      
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'property-1', landlord_id: 'landlord-1' }] }) // Property exists
        .mockResolvedValueOnce({ rows: [] }) // No active match
        .mockResolvedValueOnce({ rows: [{ id: 'existing-viewing' }] }); // Existing viewing

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'CONFLICT', message: 'You already have a pending or confirmed viewing for this property' },
      });
    });

    it('should create viewing successfully', async () => {
      mockReq.body = {
        propertyId: 'property-1',
        proposedDatetime: '2030-01-15T10:00:00.000Z',
        notes: 'Looking forward to seeing the place',
      };
      
      const mockViewing = {
        id: 'viewing-1',
        property_id: 'property-1',
        tenant_id: 'test-user-id',
        landlord_id: 'landlord-1',
        proposed_datetime: '2030-01-15T10:00:00.000Z',
        status: 'proposed',
        notes: 'Looking forward to seeing the place',
      };
      
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'property-1', landlord_id: 'landlord-1' }] }) // Property check
        .mockResolvedValueOnce({ rows: [] }) // No active match
        .mockResolvedValueOnce({ rows: [] }) // No existing viewing
        .mockResolvedValueOnce({ rows: [mockViewing] }); // Insert viewing

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { viewing: mockViewing },
        message: 'Viewing request sent successfully',
      });
    });
  });

  describe('getTenantViewings', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await getTenantViewings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return tenant viewings', async () => {
      const mockViewings = [
        {
          id: 'v1',
          property_id: 'p1',
          property_address: '123 Test Street',
          property_neighborhood: 'Test Area',
          property_image: 'https://example.com/image.jpg',
          proposed_datetime: '2030-01-15T10:00:00.000Z',
          status: 'confirmed',
          landlord_name: 'John',
          landlord_phone: '+91 9876543210',
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockViewings });

      await getTenantViewings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getLandlordViewings', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await getLandlordViewings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return landlord viewings', async () => {
      const mockViewings = [
        {
          id: 'v1',
          property_id: 'p1',
          property_address: '123 Test Street',
          tenant_name: 'Jane',
          tenant_phone: '+91 9876543211',
          proposed_datetime: '2030-01-15T10:00:00.000Z',
          status: 'proposed',
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockViewings });

      await getLandlordViewings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('confirmViewing', () => {
    it('should return 404 when viewing not found or user not landlord', async () => {
      mockReq.params = { id: 'viewing-1' };
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No viewing found (not landlord's)

      await confirmViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be confirmed' },
      });
    });

    it('should confirm viewing successfully when user is landlord', async () => {
      mockReq.params = { id: 'viewing-1' };
      const mockViewing = { 
        id: 'viewing-1', 
        status: 'confirmed',
        landlord_id: 'test-user-id',
        confirmed_datetime: '2030-01-15T10:00:00.000Z',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockViewing] });

      await confirmViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { viewing: mockViewing },
        message: 'Viewing confirmed successfully',
      });
    });
  });

  describe('cancelViewing', () => {
    it('should return 404 when viewing not found or user not authorized', async () => {
      mockReq.params = { id: 'viewing-1' };
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No viewing found

      await cancelViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Viewing not found or cannot be cancelled' },
      });
    });

    it('should cancel viewing successfully when user is tenant', async () => {
      mockReq.params = { id: 'viewing-1' };
      mockReq.body = { reason: 'Schedule conflict' };
      const mockViewing = { 
        id: 'viewing-1', 
        status: 'cancelled',
        tenant_id: 'test-user-id',
        cancelled_by: 'test-user-id',
        cancellation_reason: 'Schedule conflict',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockViewing] });

      await cancelViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { viewing: mockViewing },
        message: 'Viewing cancelled successfully',
      });
    });

    it('should cancel viewing successfully when user is landlord', async () => {
      mockReq.params = { id: 'viewing-1' };
      mockReq.body = { reason: 'Property no longer available' };
      const mockViewing = { 
        id: 'viewing-1', 
        status: 'cancelled',
        landlord_id: 'test-user-id',
        cancelled_by: 'test-user-id',
        cancellation_reason: 'Property no longer available',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockViewing] });

      await cancelViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { viewing: mockViewing },
        message: 'Viewing cancelled successfully',
      });
    });
  });
});
