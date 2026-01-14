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
    // Reset all mocks completely (not just clear)
    mockQuery.mockReset();
    
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
      // Property counts query
      mockQuery.mockResolvedValueOnce({ rows: [{ active_listings: '3', rented: '2', total: '5' }] });
      // Match counts query
      mockQuery.mockResolvedValueOnce({ rows: [{ mutual_matches: '10', interested_tenants: '5', total_tenant_likes: '15' }] });
      // Viewing counts query
      mockQuery.mockResolvedValueOnce({ rows: [{ pending: '2', confirmed: '1', total: '5' }] });
      // Profile rating query
      mockQuery.mockResolvedValueOnce({ rows: [{ rating: '4.25' }] });

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
          interestedTenants: 5,
          totalTenantLikes: 15,
          pendingViewings: 2,
          confirmedViewings: 1,
          responseRate: 85, // 4.25 * 20 = 85
        },
      });
    });

    it('should return zero counts when no data exists', async () => {
      // Property counts query - empty
      mockQuery.mockResolvedValueOnce({ rows: [{ active_listings: null, rented: null, total: null }] });
      // Match counts query - empty
      mockQuery.mockResolvedValueOnce({ rows: [{ mutual_matches: null, interested_tenants: null, total_tenant_likes: null }] });
      // Viewing counts query - empty
      mockQuery.mockResolvedValueOnce({ rows: [{ pending: null, confirmed: null, total: null }] });
      // Profile rating query - empty
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getLandlordStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          activeListings: 0,
          rentedProperties: 0,
          totalMatches: 0,
          interestedTenants: 0,
          totalTenantLikes: 0,
          pendingViewings: 0,
          confirmedViewings: 0,
          responseRate: 0,
        },
      });
    });

    it('should reflect decreased interested tenants after landlord swipe', async () => {
      // Simulate scenario: Before - 5 interested tenants
      // After landlord swipes right on 1 tenant, interested should be 4
      // and mutual_matches should increase to 11
      mockQuery.mockResolvedValueOnce({ rows: [{ active_listings: '3', rented: '2', total: '5' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ mutual_matches: '11', interested_tenants: '4', total_tenant_likes: '15' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ pending: '2', confirmed: '1', total: '5' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ rating: '4.25' }] });

      await getLandlordStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockRes.json as Mock<any>).mock.calls[0][0] as any;
      expect(jsonCall.data.interestedTenants).toBe(4);
      expect(jsonCall.data.totalMatches).toBe(11);
    });

    it('should correctly differentiate between interested tenants and mutual matches', async () => {
      // Test the SQL filter logic:
      // - interested_tenants: tenant swiped right, landlord hasn't swiped (landlord_swiped = false or null)
      // - mutual_matches: tenant swiped right, landlord swiped right (landlord_swiped = true, status = active)
      mockQuery.mockResolvedValueOnce({ rows: [{ active_listings: '1', rented: '0', total: '1' }] });
      // 0 mutual (no landlord swipes yet), 10 interested (all pending landlord action)
      mockQuery.mockResolvedValueOnce({ rows: [{ mutual_matches: '0', interested_tenants: '10', total_tenant_likes: '10' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ pending: '0', confirmed: '0', total: '0' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getLandlordStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const jsonCall = (mockRes.json as Mock<any>).mock.calls[0][0] as any;
      // All likes should be in interested_tenants since no landlord has swiped yet
      expect(jsonCall.data.interestedTenants).toBe(10);
      expect(jsonCall.data.totalMatches).toBe(0);
      expect(jsonCall.data.totalTenantLikes).toBe(10);
    });
  });

  describe('getLandlordProperties', () => {
    it('should return 401 when not authenticated', async () => {
      mockReq.userId = undefined;

      await getLandlordProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return all properties when no status filter', async () => {
      const mockProperties = [
        { id: '1', address: '123 MG Road', status: 'available', match_count: '3', view_count: '10' },
        { id: '2', address: '456 HSR Layout', status: 'rented', match_count: '5', view_count: '20' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });

      await getLandlordProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockRes.json as Mock<any>).mock.calls[0][0] as any;
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data.properties).toHaveLength(2);
      expect(jsonCall.data.properties[0].id).toBe('1');
      expect(jsonCall.data.properties[1].id).toBe('2');
      
      // Verify no status filter was applied in the query (only 1 param)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.landlord_id = $1'),
        ['test-user-id']
      );
    });

    it('should filter properties by status=available', async () => {
      mockReq.query = { status: 'available' };
      const mockProperties = [
        { id: '1', address: '123 MG Road', status: 'available', match_count: '3', view_count: '10' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });

      await getLandlordProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonCall = (mockRes.json as Mock<any>).mock.calls[0][0] as any;
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data.properties).toHaveLength(1);
      expect(jsonCall.data.properties[0].status).toBe('available');
      
      // Verify status filter was applied (2 params)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND p.status = $2'),
        ['test-user-id', 'available']
      );
    });

    it('should filter properties by status=rented', async () => {
      mockReq.query = { status: 'rented' };
      const mockProperties = [
        { id: '2', address: '456 HSR Layout', status: 'rented', match_count: '5', view_count: '20' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });

      await getLandlordProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND p.status = $2'),
        ['test-user-id', 'rented']
      );
    });

    it('should return all properties when status=all', async () => {
      mockReq.query = { status: 'all' };
      const mockProperties = [
        { id: '1', address: '123 MG Road', status: 'available', match_count: '3', view_count: '10' },
        { id: '2', address: '456 HSR Layout', status: 'rented', match_count: '5', view_count: '20' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });

      await getLandlordProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      // Verify no status filter was applied (status=all means no filter, only 1 param)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.landlord_id = $1 '),
        ['test-user-id']
      );
    });

    it('should correctly transform match and view counts to numbers', async () => {
      const mockProperties = [
        { id: '1', address: '123 MG Road', status: 'available', match_count: '5', view_count: '15', inquiry_count: '3' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });

      await getLandlordProperties(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const jsonCall = (mockRes.json as Mock<any>).mock.calls[0][0] as any;
      expect(jsonCall.data.properties[0].matchCount).toBe(5);
      expect(jsonCall.data.properties[0].viewCount).toBe(15);
      expect(jsonCall.data.properties[0].inquiryCount).toBe(3);
    });
  });
});
