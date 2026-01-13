import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { Request, Response, NextFunction } from 'express';
import {
  searchProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  getLandlordStats,
} from '../property.controller';

// Mock the database client
jest.mock('../../database/client', () => ({
  query: jest.fn(),
}));

const { query } = require('../../database/client');
const mockQuery = query as Mock<any>;

describe('Property Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
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

  describe('searchProperties', () => {
    it('should return empty array when no properties found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await searchProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          properties: [],
          total: 0,
          limit: 20,
          offset: 0,
        },
      });
    });

    it('should return filtered properties by city', async () => {
      mockReq.query = { city: 'Bangalore' };
      const mockProperties = [
        { id: '1', address: '123 MG Road', city: 'Bangalore' },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      await searchProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            properties: mockProperties,
          }),
        })
      );
    });

    it('should filter by rent range', async () => {
      mockReq.query = { minRent: '20000', maxRent: '40000' };
      
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await searchProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(query).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPropertyById', () => {
    it('should return 404 when property not found', async () => {
      mockReq.params = { id: 'non-existent-id' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getPropertyById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
    });

    it('should return property details when found', async () => {
      mockReq.params = { id: 'property-1' };
      const mockProperty = {
        id: 'property-1',
        address: '123 Test Street',
        rent: 30000,
        landlord_name: 'John Doe',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockProperty] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // View tracking

      await getPropertyById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { property: mockProperty },
      });
    });
  });

  describe('createProperty', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await createProperty(
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
      mockReq.body = { address: '123 Test Street' }; // Missing other required fields

      await createProperty(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      });
    });

    it('should create property successfully', async () => {
      mockReq.body = {
        address: '123 Test Street',
        neighborhood: 'Test Area',
        city: 'Bangalore',
        rent: 30000,
        deposit: 90000,
      };
      
      const mockCreatedProperty = {
        id: 'new-property-id',
        ...mockReq.body,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockCreatedProperty] });

      await createProperty(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { property: mockCreatedProperty },
        message: 'Property created successfully',
      });
    });
  });

  describe('deleteProperty', () => {
    it('should return 404 when property not found or not owned', async () => {
      mockReq.params = { id: 'property-1' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await deleteProperty(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found or access denied' },
      });
    });

    it('should delete property successfully', async () => {
      mockReq.params = { id: 'property-1' };
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'property-1' }] });

      await deleteProperty(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Property deleted successfully',
      });
    });
  });

  describe('getLandlordStats', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await getLandlordStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return landlord stats', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ active_listings: '3', rented: '2', total: '5' }] })
        .mockResolvedValueOnce({ rows: [{ total_matches: '10' }] })
        .mockResolvedValueOnce({ rows: [{ pending: '2', confirmed: '1', total: '5' }] })
        .mockResolvedValueOnce({ rows: [{ response_rate: '85.5' }] });

      await getLandlordStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          activeListings: 3,
          rentedProperties: 2,
          totalMatches: 10,
          pendingViewings: 2,
          confirmedViewings: 1,
          responseRate: 85.5,
        },
      });
    });
  });
});
