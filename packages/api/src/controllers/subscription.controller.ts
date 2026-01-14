/**
 * Subscription Controller
 * 
 * Handles subscription management:
 * - Get current subscription status
 * - View pricing/plans
 * - Upgrade subscription
 * - Get usage statistics
 */

import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionTier } from '@homie/shared';
import { query } from '../database/client';

/**
 * Get current user's subscription status
 * 
 * GET /api/subscription/status
 */
export const getSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    const status = await subscriptionService.getUserSubscriptionStatus(userId);
    
    res.status(200).json({
      success: true,
      data: {
        subscription: {
          tier: status.tier,
          expiresAt: status.expiresAt,
          isActive: !status.expiresAt || new Date(status.expiresAt) > new Date(),
        },
        limits: status.limits,
        usage: {
          swipesToday: status.limits.dailySwipesUsed,
          swipesRemaining: status.limits.dailySwipes - status.limits.dailySwipesUsed,
          superLikesThisMonth: status.limits.superLikesUsed,
          superLikesRemaining: status.limits.superLikesPerMonth - status.limits.superLikesUsed,
          activeChats: status.limits.activeChats,
          chatsRemaining: status.limits.simultaneousChats - status.limits.activeChats,
        },
        canSwipe: status.canSwipe,
        canSuperLike: status.canSuperLike,
        canStartChat: status.canStartChat,
        upgradeRecommended: status.upgradeRequired && status.upgradeRequired.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription pricing/plans
 * 
 * GET /api/subscription/plans
 */
export const getSubscriptionPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pricing = subscriptionService.getSubscriptionPricing();
    
    res.status(200).json({
      success: true,
      data: {
        plans: [
          {
            id: 'free',
            name: 'Free',
            tier: SubscriptionTier.FREE,
            ...pricing[SubscriptionTier.FREE],
            popular: false,
          },
          {
            id: 'premium',
            name: 'Premium',
            tier: SubscriptionTier.PREMIUM,
            ...pricing[SubscriptionTier.PREMIUM],
            popular: true,
            badge: 'Most Popular',
          },
          {
            id: 'pro',
            name: 'Pro',
            tier: SubscriptionTier.PRO,
            ...pricing[SubscriptionTier.PRO],
            popular: false,
            badge: 'Best Value',
          },
        ],
        currency: 'INR',
        currencySymbol: '₹',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upgrade subscription (mock payment - replace with actual payment gateway)
 * 
 * POST /api/subscription/upgrade
 * Body: { tier: "premium" | "pro", duration: "monthly" | "yearly", paymentToken: "..." }
 */
export const upgradeSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { tier, duration, paymentToken } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    // Validate tier
    if (!['premium', 'pro'].includes(tier)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TIER', message: 'Invalid subscription tier' },
      });
      return;
    }
    
    // Validate duration
    if (!['monthly', 'yearly'].includes(duration)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DURATION', message: 'Duration must be monthly or yearly' },
      });
      return;
    }
    
    // TODO: Integrate with actual payment gateway (Razorpay, Stripe, etc.)
    // For now, simulate successful payment
    if (!paymentToken) {
      res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_REQUIRED', message: 'Payment token required' },
      });
      return;
    }
    
    // Calculate duration in months
    const durationMonths = duration === 'yearly' ? 12 : 1;
    
    // Upgrade subscription
    const newTier = tier === 'premium' ? SubscriptionTier.PREMIUM : SubscriptionTier.PRO;
    const result = await subscriptionService.upgradeSubscription(userId, newTier, durationMonths);
    
    // Get pricing for receipt
    const pricing = subscriptionService.getSubscriptionPricing();
    const planPricing = pricing[newTier];
    const amountPaid = duration === 'yearly' ? planPricing.yearlyPrice : planPricing.monthlyPrice;
    
    // Log the upgrade event
    await query(
      `INSERT INTO analytics_events (user_id, event_type, metadata)
       VALUES ($1, 'subscription_upgrade', $2)`,
      [userId, JSON.stringify({
        fromTier: req.subscriptionStatus?.tier || 'free',
        toTier: newTier,
        duration,
        amount: amountPaid,
      })]
    );
    
    res.status(200).json({
      success: true,
      data: {
        message: `Successfully upgraded to ${tier}!`,
        subscription: {
          tier: newTier,
          expiresAt: result.expiresAt,
          duration,
        },
        receipt: {
          amount: amountPaid,
          currency: 'INR',
          date: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription (downgrade to free at end of period)
 * 
 * POST /api/subscription/cancel
 */
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    // Get current subscription
    const status = await subscriptionService.getUserSubscriptionStatus(userId);
    
    if (status.tier === SubscriptionTier.FREE) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription to cancel' },
      });
      return;
    }
    
    // Mark for cancellation (will downgrade to free when expires)
    await query(
      `UPDATE users 
       SET subscription_cancelled = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Subscription cancelled. You will retain access until the end of your billing period.',
        expiresAt: status.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage history/analytics
 * 
 * GET /api/subscription/usage?period=7d
 */
export const getUsageHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const period = req.query.period as string || '7d';
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    // Parse period
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;
    
    // Get daily swipe history
    const swipeHistory = await query(
      `SELECT 
        swipe_date,
        swipe_count,
        super_like_count
       FROM daily_swipe_counts
       WHERE user_id = $1
         AND swipe_date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY swipe_date ASC`,
      [userId]
    );
    
    // Get match statistics
    const matchStats = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE tenant_swipe_direction = 'right') as right_swipes,
        COUNT(*) FILTER (WHERE status = 'active') as matches
       FROM matches
       WHERE tenant_id = $1
         AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );
    
    res.status(200).json({
      success: true,
      data: {
        period,
        swipeHistory: swipeHistory.rows,
        matchHistory: matchStats.rows,
        summary: {
          totalSwipes: swipeHistory.rows.reduce((sum: number, r: any) => sum + (r.swipe_count || 0), 0),
          totalSuperLikes: swipeHistory.rows.reduce((sum: number, r: any) => sum + (r.super_like_count || 0), 0),
          totalMatches: matchStats.rows.reduce((sum: number, r: any) => sum + parseInt(r.matches || '0'), 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
