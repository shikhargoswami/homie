/**
 * Tests for Subscription Service
 * 
 * Tests subscription tier limits, swipe tracking,
 * and chat limits based on tech-1.md requirements
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { subscriptionService } from '../subscription.service';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '@homie/shared';
import { pgPool as pool } from '../../database/client';

// Mock the database pool
jest.mock('../../database/client', () => ({
  __esModule: true,
  pgPool: {
    connect: jest.fn(),
  },
}));

describe('SubscriptionService', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSubscriptionStatus', () => {
    it('should return FREE tier limits for new user', async () => {
      // Mock user query - free tier
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ subscription_tier: 'free', subscription_expires_at: null }],
        })
        // Mock daily swipe count
        .mockResolvedValueOnce({
          rows: [{ swipe_count: 5, super_like_count: 1 }],
        })
        // Mock monthly super likes
        .mockResolvedValueOnce({
          rows: [{ total: '2' }],
        })
        // Mock active chats
        .mockResolvedValueOnce({
          rows: [{ active_count: '2' }],
        });

      const status = await subscriptionService.getUserSubscriptionStatus('user-123');

      expect(status.tier).toBe(SubscriptionTier.FREE);
      expect(status.limits.dailySwipes).toBe(20);
      expect(status.limits.dailySwipesUsed).toBe(5);
      expect(status.limits.simultaneousChats).toBe(3);
      expect(status.canSwipe).toBe(true); // 5 < 20
      expect(status.canStartChat).toBe(true); // 2 < 3
    });

    it('should return PREMIUM tier limits for premium user', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ subscription_tier: 'premium', subscription_expires_at: futureDate }],
        })
        .mockResolvedValueOnce({
          rows: [{ swipe_count: 50, super_like_count: 5 }],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '7' }],
        })
        .mockResolvedValueOnce({
          rows: [{ active_count: '5' }],
        });

      const status = await subscriptionService.getUserSubscriptionStatus('user-456');

      expect(status.tier).toBe(SubscriptionTier.PREMIUM);
      expect(status.limits.dailySwipes).toBe(100);
      expect(status.limits.simultaneousChats).toBe(10);
      expect(status.canSwipe).toBe(true); // 50 < 100
    });

    it('should downgrade expired premium to FREE', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ subscription_tier: 'premium', subscription_expires_at: pastDate }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ active_count: '0' }] });

      const status = await subscriptionService.getUserSubscriptionStatus('user-789');

      expect(status.tier).toBe(SubscriptionTier.FREE);
      expect(status.limits.dailySwipes).toBe(20);
    });

    it('should show upgrade required when limits reached', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ subscription_tier: 'free', subscription_expires_at: null }],
        })
        .mockResolvedValueOnce({
          rows: [{ swipe_count: 20, super_like_count: 3 }], // At limit
        })
        .mockResolvedValueOnce({
          rows: [{ total: '3' }], // At super like limit
        })
        .mockResolvedValueOnce({
          rows: [{ active_count: '3' }], // At chat limit
        });

      const status = await subscriptionService.getUserSubscriptionStatus('user-limited');

      expect(status.canSwipe).toBe(false);
      expect(status.canSuperLike).toBe(false);
      expect(status.canStartChat).toBe(false);
      expect(status.upgradeRequired).toContain('daily_swipe_limit_reached');
      expect(status.upgradeRequired).toContain('super_like_limit_reached');
      expect(status.upgradeRequired).toContain('chat_limit_reached');
    });
  });

  describe('recordSwipe', () => {
    it('should record successful swipe', async () => {
      // First call gets subscription status
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ subscription_tier: 'free', subscription_expires_at: null }],
        })
        .mockResolvedValueOnce({ rows: [{ swipe_count: 5 }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ active_count: '0' }] })
        // Second call records the swipe
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await subscriptionService.recordSwipe('user-123', false);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(14); // 20 - 5 - 1
    });

    it('should reject swipe when limit reached', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ subscription_tier: 'free', subscription_expires_at: null }],
        })
        .mockResolvedValueOnce({ rows: [{ swipe_count: 20 }] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [{ active_count: '0' }] });

      const result = await subscriptionService.recordSwipe('user-limited', false);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Daily swipe limit reached');
    });
  });

  describe('getSubscriptionPricing', () => {
    it('should return correct pricing for all tiers', () => {
      const pricing = subscriptionService.getSubscriptionPricing();

      expect(pricing[SubscriptionTier.FREE].monthlyPrice).toBe(0);
      expect(pricing[SubscriptionTier.PREMIUM].monthlyPrice).toBe(499);
      expect(pricing[SubscriptionTier.PRO].monthlyPrice).toBe(999);
      
      // Verify yearly discount
      expect(pricing[SubscriptionTier.PREMIUM].yearlyPrice).toBeLessThan(
        pricing[SubscriptionTier.PREMIUM].monthlyPrice * 12
      );
    });
  });
});
