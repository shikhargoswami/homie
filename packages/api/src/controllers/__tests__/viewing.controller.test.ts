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
      mockReq.body = { propertyId: 'property-1' }; // Missing date and time

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Property ID, date and time are required' },
      });
    });

    it('should return 404 when property not found', async () => {
      mockReq.body = {
        propertyId: 'non-existent',
        date: '2024-01-15',
        time: '10:00 AM',
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

    it('should return 409 when time slot is already booked', async () => {
      mockReq.body = {
        propertyId: 'property-1',
        date: '2024-01-15',
        time: '10:00 AM',
      };
      
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'property-1', landlord_id: 'landlord-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'existing-viewing' }] });

      await scheduleViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'CONFLICT', message: 'This time slot is already booked' },
      });
    });

    it('should create viewing successfully', async () => {
      mockReq.body = {
        propertyId: 'property-1',
        date: '2024-01-15',
        time: '10:00 AM',
        notes: 'Looking forward to seeing the place',
      };
      
      const mockViewing = {
        id: 'viewing-1',
        ...mockReq.body,
        tenant_id: 'test-user-id',
        landlord_id: 'landlord-1',
        status: 'pending',
      };
      
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'property-1', landlord_id: 'landlord-1' }] })
        .mockResolvedValueOnce({ rows: [] }) // No existing booking
        .mockResolvedValueOnce({ rows: [mockViewing] });

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
          date: '2024-01-15',
          time: '10:00 AM',
          status: 'confirmed',
          counterparty_name: 'John',
          counterparty_phone: '+91 9876543210',
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockViewings });

      await getTenantViewings(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          viewings: expect.arrayContaining([
            expect.objectContaining({
              id: 'v1',
              propertyId: 'p1',
              counterpartyName: 'John (Owner)',
            }),
          ]),
        },
      });
    });
  });

  describe('confirmViewing', () => {
    it('should return 404 when viewing not found or not pending', async () => {
      mockReq.params = { id: 'viewing-1' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

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

    it('should confirm viewing successfully', async () => {
      mockReq.params = { id: 'viewing-1' };
      const mockViewing = { id: 'viewing-1', status: 'confirmed' };
      
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
    it('should return 404 when viewing not found', async () => {
      mockReq.params = { id: 'viewing-1' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await cancelViewing(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should cancel viewing successfully', async () => {
      mockReq.params = { id: 'viewing-1' };
      const mockViewing = { id: 'viewing-1', status: 'cancelled' };
      
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
