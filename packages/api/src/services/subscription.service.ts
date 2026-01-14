/**
 * Subscription Service
 * 
 * Manages subscription tiers, swipe limits, and chat limits
 * Based on tech-1.md monetization strategy:
 * 
 * FREE Tier:
 * - 20 swipes/day
 * - 3 super likes/month
 * - 3 simultaneous chats
 * 
 * PREMIUM Tier:
 * - 100 swipes/day
 * - 10 super likes/month
 * - 10 simultaneous chats
 * - Priority support
 * 
 * PRO Tier:
 * - Unlimited swipes
 * - Unlimited super likes
 * - Unlimited chats
 * - Verified badge
 * - Analytics dashboard
 */

import { pgPool as pool } from '../database/client';
import {
  SubscriptionTier,
  SwipeLimits,
  SUBSCRIPTION_LIMITS,
} from '@homie/shared';

export interface DailySwipeCount {
  id: string;
  userId: string;
  swipeDate: Date;
  swipeCount: number;
  superLikeCount: number;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt?: Date;
  limits: SwipeLimits;
  canSwipe: boolean;
  canSuperLike: boolean;
  canStartChat: boolean;
  upgradeRequired?: string[];
}

class SubscriptionService {
  /**
   * Get user's current subscription status
   */
  async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const client = await pool.connect();
    
    try {
      // Get user's subscription tier
      const userResult = await client.query(
        `SELECT subscription_tier, subscription_expires_at 
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const { subscription_tier, subscription_expires_at } = userResult.rows[0];
      const tier = (subscription_tier || 'free') as SubscriptionTier;
      
      // Check if subscription has expired
      const isExpired = subscription_expires_at && 
        new Date(subscription_expires_at) < new Date();
      const effectiveTier = isExpired ? SubscriptionTier.FREE : tier;

      // Get today's swipe count
      const swipeResult = await client.query(
        `SELECT swipe_count, super_like_count 
         FROM daily_swipe_counts 
         WHERE user_id = $1 AND swipe_date = CURRENT_DATE`,
        [userId]
      );

      const dailySwipesUsed = swipeResult.rows[0]?.swipe_count || 0;
      const superLikesUsed = await this.getMonthlySuperLikesUsed(userId, client);

      // Get active chat count
      const chatResult = await client.query(
        `SELECT COUNT(*) as active_count 
         FROM conversations c
         JOIN matches m ON c.match_id = m.id
         WHERE (m.tenant_id = $1 OR m.landlord_id = $1)
           AND c.is_archived = false`,
        [userId]
      );

      const activeChats = parseInt(chatResult.rows[0]?.active_count || '0', 10);

      // Calculate limits
      const baseLimits = { ...SUBSCRIPTION_LIMITS[effectiveTier] };
      const limits: SwipeLimits = {
        ...baseLimits,
        dailySwipesUsed,
        superLikesUsed,
        activeChats,
      };

      // Determine what actions are allowed
      const canSwipe = dailySwipesUsed < limits.dailySwipes;
      const canSuperLike = superLikesUsed < limits.superLikesPerMonth;
      const canStartChat = activeChats < limits.simultaneousChats;

      // Determine upgrade recommendations
      const upgradeRequired: string[] = [];
      if (!canSwipe) upgradeRequired.push('daily_swipe_limit_reached');
      if (!canSuperLike) upgradeRequired.push('super_like_limit_reached');
      if (!canStartChat) upgradeRequired.push('chat_limit_reached');

      return {
        tier: effectiveTier,
        expiresAt: subscription_expires_at ? new Date(subscription_expires_at) : undefined,
        limits,
        canSwipe,
        canSuperLike,
        canStartChat,
        upgradeRequired: upgradeRequired.length > 0 ? upgradeRequired : undefined,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Record a swipe action
   */
  async recordSwipe(userId: string, isSuperLike: boolean = false): Promise<{
    success: boolean;
    remaining: number;
    error?: string;
  }> {
    const status = await this.getUserSubscriptionStatus(userId);

    if (isSuperLike && !status.canSuperLike) {
      return {
        success: false,
        remaining: 0,
        error: 'Super like limit reached. Upgrade to Premium for more.',
      };
    }

    if (!isSuperLike && !status.canSwipe) {
      return {
        success: false,
        remaining: 0,
        error: 'Daily swipe limit reached. Upgrade to Premium for more swipes.',
      };
    }

    const client = await pool.connect();
    
    try {
      // Upsert daily swipe count
      const columnToUpdate = isSuperLike ? 'super_like_count' : 'swipe_count';
      
      await client.query(
        `INSERT INTO daily_swipe_counts (user_id, swipe_date, ${columnToUpdate})
         VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT (user_id, swipe_date)
         DO UPDATE SET ${columnToUpdate} = daily_swipe_counts.${columnToUpdate} + 1,
                       updated_at = CURRENT_TIMESTAMP`,
        [userId]
      );

      const remaining = isSuperLike
        ? status.limits.superLikesPerMonth - status.limits.superLikesUsed - 1
        : status.limits.dailySwipes - status.limits.dailySwipesUsed - 1;

      return { success: true, remaining };
    } finally {
      client.release();
    }
  }

  /**
   * Check if user can start a new chat
   */
  async canStartChat(userId: string): Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number;
    error?: string;
  }> {
    const status = await this.getUserSubscriptionStatus(userId);

    return {
      allowed: status.canStartChat,
      currentCount: status.limits.activeChats,
      limit: status.limits.simultaneousChats,
      error: status.canStartChat
        ? undefined
        : `Chat limit reached (${status.limits.activeChats}/${status.limits.simultaneousChats}). Upgrade for more.`,
    };
  }

  /**
   * Upgrade user's subscription
   */
  async upgradeSubscription(
    userId: string,
    newTier: SubscriptionTier,
    durationMonths: number = 1
  ): Promise<{ success: boolean; expiresAt: Date }> {
    const client = await pool.connect();

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      await client.query(
        `UPDATE users 
         SET subscription_tier = $1,
             subscription_expires_at = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newTier, expiresAt, userId]
      );

      return { success: true, expiresAt };
    } finally {
      client.release();
    }
  }

  /**
   * Reset daily swipe count (called by cron job at midnight)
   */
  async resetDailySwipes(): Promise<number> {
    const client = await pool.connect();

    try {
      // Delete old daily counts (older than 7 days for analytics)
      const result = await client.query(
        `DELETE FROM daily_swipe_counts 
         WHERE swipe_date < CURRENT_DATE - INTERVAL '7 days'`
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Get monthly super likes used
   */
  private async getMonthlySuperLikesUsed(
    userId: string,
    client: any
  ): Promise<number> {
    const result = await client.query(
      `SELECT COALESCE(SUM(super_like_count), 0) as total
       FROM daily_swipe_counts
       WHERE user_id = $1
         AND swipe_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    return parseInt(result.rows[0]?.total || '0', 10);
  }

  /**
   * Get subscription pricing info
   */
  getSubscriptionPricing(): Record<SubscriptionTier, {
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  }> {
    return {
      [SubscriptionTier.FREE]: {
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          '20 swipes per day',
          '3 super likes per month',
          '3 simultaneous chats',
          'Basic property filters',
        ],
      },
      [SubscriptionTier.PREMIUM]: {
        monthlyPrice: 499,
        yearlyPrice: 3999,
        features: [
          '100 swipes per day',
          '10 super likes per month',
          '10 simultaneous chats',
          'Advanced lifestyle filters',
          'Commute time calculator',
          'Priority support',
          'No ads',
        ],
      },
      [SubscriptionTier.PRO]: {
        monthlyPrice: 999,
        yearlyPrice: 7999,
        features: [
          'Unlimited swipes',
          'Unlimited super likes',
          'Unlimited chats',
          'All lifestyle filters',
          'Verified badge',
          'Analytics dashboard',
          'Priority property alerts',
          'Direct landlord contact after viewing',
          'Dedicated support',
        ],
      },
    };
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
