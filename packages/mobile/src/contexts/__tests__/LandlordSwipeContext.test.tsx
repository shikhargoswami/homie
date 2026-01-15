import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  LandlordSwipeProvider,
  useLandlordSwipe,
  TenantCard,
  formatLifestyleTag,
  formatOccupationType,
  formatBudgetRange,
} from '../LandlordSwipeContext';

// Mock the API client
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { apiClient } from '../../services/api';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LandlordSwipeProvider>{children}</LandlordSwipeProvider>
);

// Mock tenant data
const mockTenantCards: TenantCard[] = [
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
  {
    tenantId: 'tenant-2',
    matchId: 'match-2',
    name: 'Priya Patel',
    photo: 'https://example.com/photo2.jpg',
    age: 26,
    workLocationName: 'Electronic City',
    company: 'Wipro',
    occupationType: 'corporate',
    budgetMin: 20000,
    budgetMax: 35000,
    lifestyleTags: ['quiet_mornings', 'cook_frequently'],
    matchScore: 78,
    matchReason: '78% Match - Early riser',
    matchHighlights: ['Early riser', 'Home cook'],
    property: {
      id: 'prop-2',
      address: '456 HSR Layout',
      neighborhood: 'HSR Layout',
      rent: 30000,
    },
    interestedAt: '2025-01-11T10:00:00Z',
  },
];

describe('LandlordSwipeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useLandlordSwipe hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useLandlordSwipe());
      }).toThrow('useLandlordSwipe must be used within a LandlordSwipeProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      expect(result.current.tenantFeed).toEqual([]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalPending).toBe(0);
      expect(result.current.isLoadingFeed).toBe(false);
      expect(result.current.isSwiping).toBe(false);
      expect(result.current.currentCard).toBeNull();
      expect(result.current.hasMoreCards).toBe(false);
      expect(result.current.lastSwipeResult).toBeNull();
    });
  });

  describe('loadTenantFeed', () => {
    it('should load tenant feed successfully', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            tenants: mockTenantCards,
            totalPending: 5,
            count: 2,
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      expect(result.current.tenantFeed).toHaveLength(2);
      expect(result.current.tenantFeed[0].name).toBe('Rahul Sharma');
      expect(result.current.totalPending).toBe(5);
      expect(result.current.currentCard).toEqual(mockTenantCards[0]);
      expect(result.current.hasMoreCards).toBe(true);
    });

    it('should handle empty feed', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            tenants: [],
            totalPending: 0,
            count: 0,
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      expect(result.current.tenantFeed).toHaveLength(0);
      expect(result.current.totalPending).toBe(0);
      expect(result.current.currentCard).toBeNull();
      expect(result.current.hasMoreCards).toBe(false);
    });

    it('should handle API error gracefully', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      expect(result.current.tenantFeed).toHaveLength(0);
      expect(result.current.totalPending).toBe(0);
      expect(result.current.isLoadingFeed).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValueOnce(promise as any);

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      act(() => {
        result.current.loadTenantFeed();
      });

      expect(result.current.isLoadingFeed).toBe(true);

      await act(async () => {
        resolvePromise!({
          data: { data: { tenants: [], totalPending: 0 } },
        });
      });

      expect(result.current.isLoadingFeed).toBe(false);
    });
  });

  describe('swipeRight', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });
    });

    it('should record swipe right and handle mutual match', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            matchId: 'match-1',
            isMutualMatch: true,
            chatUnlocked: true,
            message: "It's a match!",
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      let swipeResult;
      await act(async () => {
        swipeResult = await result.current.swipeRight('match-1');
      });

      expect(swipeResult).toEqual({
        success: true,
        isMutualMatch: true,
        matchId: 'match-1',
        chatUnlocked: true,
        message: "It's a match!",
      });

      expect(result.current.lastSwipeResult?.isMutualMatch).toBe(true);
      expect(result.current.tenantFeed).toHaveLength(1);
      expect(result.current.totalPending).toBe(1);
    });

    it('should handle swipe error', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          data: {
            error: { message: 'Already responded' },
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      let swipeResult;
      await act(async () => {
        swipeResult = await result.current.swipeRight('match-1');
      });

      expect(swipeResult?.success).toBe(false);
      expect(swipeResult?.message).toBe('Already responded');
    });
  });

  describe('swipeLeft', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });
    });

    it('should record swipe left (decline)', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            matchId: 'match-1',
            isMutualMatch: false,
            message: 'Tenant declined',
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      let swipeResult;
      await act(async () => {
        swipeResult = await result.current.swipeLeft('match-1');
      });

      expect(swipeResult).toEqual({
        success: true,
        isMutualMatch: false,
        matchId: 'match-1',
        message: 'Tenant declined',
      });

      expect(result.current.tenantFeed).toHaveLength(1);
      expect(result.current.totalPending).toBe(1);
    });
  });

  describe('nextCard', () => {
    it('should move to next card', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentCard?.name).toBe('Rahul Sharma');

      act(() => {
        result.current.nextCard();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentCard?.name).toBe('Priya Patel');
    });

    it('should not exceed feed length', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: [mockTenantCards[0]],
            totalPending: 1,
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      act(() => {
        result.current.nextCard();
        result.current.nextCard();
        result.current.nextCard();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.hasMoreCards).toBe(false);
    });
  });

  describe('resetFeed', () => {
    it('should reset all state', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      expect(result.current.tenantFeed).toHaveLength(2);

      act(() => {
        result.current.resetFeed();
      });

      expect(result.current.tenantFeed).toHaveLength(0);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalPending).toBe(0);
      expect(result.current.lastSwipeResult).toBeNull();
    });
  });

  describe('clearLastResult', () => {
    it('should clear last swipe result', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: { tenants: mockTenantCards, totalPending: 2 } },
      });
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: { matchId: 'match-1', isMutualMatch: true, message: 'Match!' },
        },
      });

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
        await result.current.swipeRight('match-1');
      });

      expect(result.current.lastSwipeResult).not.toBeNull();

      act(() => {
        result.current.clearLastResult();
      });

      expect(result.current.lastSwipeResult).toBeNull();
    });
  });
});

describe('Helper functions', () => {
  describe('formatLifestyleTag', () => {
    it('should format known tags', () => {
      expect(formatLifestyleTag('pet_owner_dog')).toBe('🐕 Dog Owner');
      expect(formatLifestyleTag('gym_nearby')).toBe('💪 Fitness Enthusiast');
      expect(formatLifestyleTag('wfh_heavy')).toBe('💻 Works from Home');
    });

    it('should format unknown tags', () => {
      expect(formatLifestyleTag('custom_tag')).toBe('Custom Tag');
    });
  });

  describe('formatOccupationType', () => {
    it('should format known occupation types', () => {
      expect(formatOccupationType('it_professional')).toBe('IT Professional');
      expect(formatOccupationType('student')).toBe('Student');
      expect(formatOccupationType('freelancer')).toBe('Freelancer');
    });

    it('should format unknown occupation types', () => {
      expect(formatOccupationType('custom_occupation')).toBe('Custom Occupation');
    });
  });

  describe('formatBudgetRange', () => {
    it('should format budget range in K format', () => {
      expect(formatBudgetRange(25000, 45000)).toBe('₹25K - ₹45K');
      expect(formatBudgetRange(10000, 20000)).toBe('₹10K - ₹20K');
    });

    it('should handle small amounts', () => {
      expect(formatBudgetRange(500, 1000)).toBe('₹500 - ₹1K');
    });
  });

  describe('Event Emission', () => {
    const { landlordEvents, LANDLORD_EVENTS } = require('../LandlordEvents');

    beforeEach(() => {
      jest.clearAllMocks();
      landlordEvents.clear();
    });

    it('should emit events on swipeRight with mutual match', async () => {
      // Setup feed
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });

      // Mock successful mutual match
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            matchId: 'match-1',
            isMutualMatch: true,
            chatUnlocked: true,
          },
        },
      });

      const swipeCompletedSpy = jest.fn();
      const interestedChangedSpy = jest.fn();
      const mutualMatchSpy = jest.fn();
      const mutualMatchesChangedSpy = jest.fn();
      const refreshStatsSpy = jest.fn();

      landlordEvents.on(LANDLORD_EVENTS.SWIPE_COMPLETED, swipeCompletedSpy);
      landlordEvents.on(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED, interestedChangedSpy);
      landlordEvents.on(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED, mutualMatchSpy);
      landlordEvents.on(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED, mutualMatchesChangedSpy);
      landlordEvents.on(LANDLORD_EVENTS.REFRESH_STATS, refreshStatsSpy);

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      await act(async () => {
        await result.current.swipeRight('match-1');
      });

      expect(swipeCompletedSpy).toHaveBeenCalledWith(expect.objectContaining({
        matchId: 'match-1',
        direction: 'right',
      }));
      expect(interestedChangedSpy).toHaveBeenCalled();
      expect(mutualMatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        matchId: 'match-1',
      }));
      expect(mutualMatchesChangedSpy).toHaveBeenCalled();
      expect(refreshStatsSpy).toHaveBeenCalled();
    });

    it('should emit events on swipeRight without mutual match', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            matchId: 'match-1',
            isMutualMatch: false,
          },
        },
      });

      const mutualMatchSpy = jest.fn();
      const mutualMatchesChangedSpy = jest.fn();

      landlordEvents.on(LANDLORD_EVENTS.MUTUAL_MATCH_CREATED, mutualMatchSpy);
      landlordEvents.on(LANDLORD_EVENTS.MUTUAL_MATCHES_CHANGED, mutualMatchesChangedSpy);

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      await act(async () => {
        await result.current.swipeRight('match-1');
      });

      // Should NOT emit mutual match events when not a mutual match
      expect(mutualMatchSpy).not.toHaveBeenCalled();
      expect(mutualMatchesChangedSpy).not.toHaveBeenCalled();
    });

    it('should emit events on swipeLeft (decline)', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { matchId: 'match-1' },
        },
      });

      const swipeCompletedSpy = jest.fn();
      const interestedChangedSpy = jest.fn();
      const refreshStatsSpy = jest.fn();

      landlordEvents.on(LANDLORD_EVENTS.SWIPE_COMPLETED, swipeCompletedSpy);
      landlordEvents.on(LANDLORD_EVENTS.INTERESTED_TENANTS_CHANGED, interestedChangedSpy);
      landlordEvents.on(LANDLORD_EVENTS.REFRESH_STATS, refreshStatsSpy);

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      await act(async () => {
        await result.current.swipeLeft('match-1');
      });

      expect(swipeCompletedSpy).toHaveBeenCalledWith(expect.objectContaining({
        matchId: 'match-1',
        direction: 'left',
      }));
      expect(interestedChangedSpy).toHaveBeenCalled();
      expect(refreshStatsSpy).toHaveBeenCalled();
    });

    it('should not emit events on swipe failure', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            tenants: mockTenantCards,
            totalPending: 2,
          },
        },
      });

      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      const swipeCompletedSpy = jest.fn();
      const refreshStatsSpy = jest.fn();

      landlordEvents.on(LANDLORD_EVENTS.SWIPE_COMPLETED, swipeCompletedSpy);
      landlordEvents.on(LANDLORD_EVENTS.REFRESH_STATS, refreshStatsSpy);

      const { result } = renderHook(() => useLandlordSwipe(), { wrapper });

      await act(async () => {
        await result.current.loadTenantFeed();
      });

      await act(async () => {
        await result.current.swipeRight('match-1');
      });

      // Events should NOT be emitted on failure
      expect(swipeCompletedSpy).not.toHaveBeenCalled();
      expect(refreshStatsSpy).not.toHaveBeenCalled();
    });
  });
});
