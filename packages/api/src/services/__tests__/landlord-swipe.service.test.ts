import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Mock } from 'jest-mock';

/**
 * Landlord Swipe Service Tests
 * 
 * Tests for tenant recommendation and landlord swiping functionality
 */

// Mock database
jest.mock('../../database/client', () => ({
  query: jest.fn(),
}));

import { query } from '../../database/client';
import { landlordSwipeService } from '../landlord-swipe.service';

describe('Landlord Swipe Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantSwipeFeed', () => {
    it('should return tenant cards for landlord', async () => {
      const mockTenantData = {
        rows: [
          {
            match_id: 'match-1',
            tenant_id: 'tenant-1',
            tenant_name: 'John Tenant',
            photo: 'https://example.com/photo.jpg',
            age: 28,
            work_location_name: 'Koramangala',
            company_name: 'Tech Corp',
            occupation_type: 'employed',
            budget_min: 15000,
            budget_max: 30000,
            lifestyle_tags: ['early_riser', 'gym_nearby'],
            match_score: 85,
            match_reason: 'Great lifestyle match',
            match_highlights: ['Budget fits', 'Close to work'],
            interested_at: new Date().toISOString(),
            property_id: 'prop-1',
            property_address: '123 MG Road',
            property_neighborhood: 'Koramangala',
            property_rent: 25000,
            is_verified: true,
            employment_verified: true,
            income_verified: false,
            is_couple: false,
            family_size: 1,
            has_children: false,
          },
        ],
      };

      (query as Mock<any>).mockResolvedValueOnce(mockTenantData);

      const result = await landlordSwipeService.getTenantSwipeFeed('landlord-1', 20);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['landlord-1', 20]
      );
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe('tenant-1');
      expect(result[0].name).toBe('John Tenant');
    });

    it('should return empty array when no interested tenants', async () => {
      (query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      const result = await landlordSwipeService.getTenantSwipeFeed('landlord-1');

      expect(result).toEqual([]);
    });
  });

  describe('recordSwipe', () => {
    it('should record right swipe and create mutual match', async () => {
      // Mock getting the match
      (query as Mock<any>).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'match-1',
          tenant_id: 'tenant-1',
          property_id: 'prop-1',
          landlord_id: 'landlord-1',
          tenant_swipe_direction: 'right',
          landlord_swiped: false,
          address: '123 MG Road',
          tenant_name: 'John Tenant',
          tenant_phone: '+919876543210',
        }],
      });
      
      // Mock update
      (query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      const result = await landlordSwipeService.recordSwipe('landlord-1', 'match-1', 'right');

      expect(result.success).toBe(true);
      expect(result.isMutualMatch).toBe(true);
    });

    it('should record left swipe (reject tenant)', async () => {
      // Mock getting the match
      (query as Mock<any>).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'match-1',
          tenant_id: 'tenant-1',
          property_id: 'prop-1',
          landlord_id: 'landlord-1',
          tenant_swipe_direction: 'right',
          landlord_swiped: false,
        }],
      });
      
      // Mock update
      (query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      const result = await landlordSwipeService.recordSwipe('landlord-1', 'match-1', 'left');

      expect(result.success).toBe(true);
      expect(result.isMutualMatch).toBe(false);
    });

    it('should return error for non-existent match', async () => {
      (query as Mock<any>).mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const result = await landlordSwipeService.recordSwipe('landlord-1', 'invalid-match', 'right');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('getPendingSwipeCount', () => {
    it('should return count of pending swipes', async () => {
      (query as Mock<any>).mockResolvedValueOnce({
        rows: [{ count: '8' }],
      });

      const count = await landlordSwipeService.getPendingSwipeCount('landlord-1');

      expect(count).toBe(8);
    });
  });

  describe('declineAllPendingForProperty', () => {
    it('should decline all pending swipes for a property', async () => {
      (query as Mock<any>).mockResolvedValueOnce({
        rowCount: 5,
        rows: [],
      });

      const count = await landlordSwipeService.declineAllPendingForProperty('prop-1');

      expect(count).toBe(5);
    });
  });
});
