/**
 * LandlordContext Tests
 * 
 * Tests for the centralized landlord state management context
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { LandlordProvider, useLandlord } from '../LandlordContext';

// Mock the API client
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import { apiClient } from '../../services/api';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LandlordProvider>{children}</LandlordProvider>
);

describe('LandlordContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have null stats initially', () => {
      const { result } = renderHook(() => useLandlord(), { wrapper });
      
      expect(result.current.stats).toBeNull();
      expect(result.current.interestedTenants).toEqual([]);
      expect(result.current.mutualMatches).toEqual([]);
      expect(result.current.viewingRequests).toEqual([]);
      expect(result.current.properties).toEqual([]);
    });

    it('should have loading states as false initially', () => {
      const { result } = renderHook(() => useLandlord(), { wrapper });
      
      expect(result.current.isLoadingStats).toBe(false);
      expect(result.current.isLoadingInterestedTenants).toBe(false);
      expect(result.current.isLoadingMutualMatches).toBe(false);
      expect(result.current.isLoadingViewings).toBe(false);
      expect(result.current.isLoadingProperties).toBe(false);
    });
  });

  describe('refreshStats', () => {
    it('should fetch and set stats correctly', async () => {
      const mockStats = {
        activeListings: 4,
        rentedProperties: 1,
        totalMatches: 2,
        interestedTenants: 8,
        totalTenantLikes: 10,
        pendingViewings: 3,
        confirmedViewings: 1,
        responseRate: 85,
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockStats },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshStats();
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/landlord/stats');
    });

    it('should handle unwrapped API response', async () => {
      const mockStats = {
        activeListings: 4,
        interestedTenants: 8,
        responseRate: 85,
      };

      // API returns data directly without wrapper
      mockApiClient.get.mockResolvedValueOnce({
        data: mockStats,
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshStats();
      });

      expect(result.current.stats?.activeListings).toBe(4);
      expect(result.current.stats?.interestedTenants).toBe(8);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshStats();
      });

      // Stats should remain null on error
      expect(result.current.stats).toBeNull();
      expect(result.current.isLoadingStats).toBe(false);
    });
  });

  describe('refreshInterestedTenants', () => {
    it('should fetch and transform interested tenants correctly', async () => {
      const mockMatches = {
        matches: [
          {
            id: 'match-1',
            tenant: { id: 'tenant-1', name: 'John Doe', phone: '9876543210' },
            property: { id: 'prop-1', address: '123 Main St', neighborhood: 'Downtown' },
            matchedAt: '2026-01-10T10:00:00Z',
            matchScore: 85,
          },
        ],
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockMatches },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshInterestedTenants();
      });

      expect(result.current.interestedTenants).toHaveLength(1);
      expect(result.current.interestedTenants[0]).toEqual({
        id: 'match-1',
        matchId: 'match-1',
        tenant: expect.objectContaining({ id: 'tenant-1', name: 'John Doe' }),
        property: expect.objectContaining({ id: 'prop-1', address: '123 Main St' }),
        matchedAt: '2026-01-10T10:00:00Z',
        matchScore: 85,
      });
    });
  });

  describe('refreshMutualMatches', () => {
    it('should fetch and transform mutual matches correctly', async () => {
      const mockMatches = {
        matches: [
          {
            id: 'match-2',
            tenant: { id: 'tenant-2', name: 'Jane Smith' },
            property: { id: 'prop-2', address: '456 Oak Ave', neighborhood: 'Uptown' },
            matchedAt: '2026-01-12T14:00:00Z',
            hasConversation: true,
          },
        ],
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockMatches },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshMutualMatches();
      });

      expect(result.current.mutualMatches).toHaveLength(1);
      expect(result.current.mutualMatches[0].tenant.name).toBe('Jane Smith');
      expect(result.current.mutualMatches[0].hasConversation).toBe(true);
    });
  });

  describe('acceptTenant', () => {
    it('should accept tenant and update state correctly', async () => {
      // Setup initial interested tenants
      const mockInterestedTenants = {
        matches: [
          {
            id: 'match-1',
            tenant: { id: 'tenant-1', name: 'John Doe' },
            property: { id: 'prop-1', address: '123 Main St', neighborhood: 'Downtown' },
            matchedAt: '2026-01-10T10:00:00Z',
          },
        ],
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockInterestedTenants },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      // Load interested tenants first
      await act(async () => {
        await result.current.refreshInterestedTenants();
      });

      expect(result.current.interestedTenants).toHaveLength(1);

      // Mock accept response
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      // Mock stats refresh
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { totalMatches: 1, interestedTenants: 0 } },
      });

      // Accept the tenant
      let success: boolean = false;
      await act(async () => {
        success = await result.current.acceptTenant('match-1');
      });

      expect(success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/matches/match-1/respond', {
        action: 'accept',
      });
      
      // Interested tenant should be removed
      expect(result.current.interestedTenants).toHaveLength(0);
      // Mutual matches should have new entry
      expect(result.current.mutualMatches).toHaveLength(1);
      expect(result.current.mutualMatches[0].tenant.name).toBe('John Doe');
    });

    it('should return false on API error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLandlord(), { wrapper });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.acceptTenant('match-1');
      });

      expect(success).toBe(false);
    });
  });

  describe('declineTenant', () => {
    it('should decline tenant and remove from interested list', async () => {
      // Setup initial interested tenants
      const mockInterestedTenants = {
        matches: [
          {
            id: 'match-1',
            tenant: { id: 'tenant-1', name: 'John Doe' },
            property: { id: 'prop-1', address: '123 Main St', neighborhood: 'Downtown' },
            matchedAt: '2026-01-10T10:00:00Z',
          },
        ],
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockInterestedTenants },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshInterestedTenants();
      });

      // Mock decline response
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      // Mock stats refresh
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { totalMatches: 0, interestedTenants: 0 } },
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.declineTenant('match-1');
      });

      expect(success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/matches/match-1/respond', {
        action: 'decline',
      });
      expect(result.current.interestedTenants).toHaveLength(0);
      // Should NOT be added to mutual matches
      expect(result.current.mutualMatches).toHaveLength(0);
    });
  });

  describe('refreshAll', () => {
    it('should refresh all data in parallel', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: {} },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshAll();
      });

      // Should have called all 5 endpoints
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/landlord/stats');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/matches/interested-tenants');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/matches/mutual');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/landlord/pending-requests');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/landlord/properties');
    });
  });

  describe('respondToViewing', () => {
    it('should accept viewing request correctly', async () => {
      // Setup initial viewing requests
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            requests: [
              { id: 'viewing-1', status: 'proposed', tenant: { name: 'Test' }, property: { address: '123 St' } },
            ],
          },
        },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      await act(async () => {
        await result.current.refreshViewingRequests();
      });

      expect(result.current.viewingRequests).toHaveLength(1);

      // Mock respond
      mockApiClient.patch.mockResolvedValueOnce({
        data: { success: true },
      });

      // Mock stats refresh
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: {} },
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.respondToViewing('viewing-1', true);
      });

      expect(success).toBe(true);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/viewings/viewing-1/respond', {
        action: 'confirm',
        counterDatetime: undefined,
      });
      expect(result.current.viewingRequests).toHaveLength(0);
    });
  });

  describe('Event Integration', () => {
    // Import events for testing
    const { landlordEvents, LANDLORD_EVENTS } = require('../LandlordEvents');

    beforeEach(() => {
      landlordEvents.clear();
    });

    it('should refresh stats when REFRESH_STATS event is emitted', async () => {
      const mockStats = {
        activeListings: 4,
        interestedTenants: 8,
        totalMatches: 2,
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockStats },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      // Clear the initial call count
      mockApiClient.get.mockClear();

      // Emit the event
      await act(async () => {
        landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
        // Wait for async refresh to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/landlord/stats');
    });

    it('should refresh interested tenants when INTERESTED_TENANTS_CHANGED event is emitted', async () => {
      const mockTenants = [
        { id: 'tenant-1', name: 'John Doe' },
        { id: 'tenant-2', name: 'Jane Doe' },
      ];

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: { tenants: mockTenants } },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      mockApiClient.get.mockClear();

      await act(async () => {
        landlordEvents.emit(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/matches/interested-tenants');
    });

    it('should refresh mutual matches when MUTUAL_MATCHES_CHANGED event is emitted', async () => {
      const mockMatches = [
        { id: 'match-1', tenantName: 'John Doe' },
      ];

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: { matches: mockMatches } },
      });

      const { result } = renderHook(() => useLandlord(), { wrapper });

      mockApiClient.get.mockClear();

      await act(async () => {
        landlordEvents.emit(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/matches/mutual');
    });

    it('should cleanup event listeners on unmount', async () => {
      const mockStats = { activeListings: 1 };
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockStats },
      });

      const { result, unmount } = renderHook(() => useLandlord(), { wrapper });

      mockApiClient.get.mockClear();

      // Unmount the component
      unmount();

      // Emit event after unmount
      await act(async () => {
        landlordEvents.emit(LANDLORD_EVENTS.REFRESH_STATS);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Stats should NOT have been refreshed after unmount
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });
});

describe('useLandlord hook', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useLandlord());
    }).toThrow('useLandlord must be used within a LandlordProvider');
    
    consoleSpy.mockRestore();
  });
});
