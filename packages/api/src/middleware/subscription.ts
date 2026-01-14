/**
 * Subscription Middleware
 * 
 * Enforces subscription-based limits on API endpoints:
 * - Swipe limits (daily)
 * - Super like limits (monthly)
 * - Chat limits (simultaneous)
 * 
 * Usage:
 * router.post('/swipe', requireSwipeLimit, swipeHandler);
 * router.post('/chat/start', requireChatLimit, startChatHandler);
 */

import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionTier } from '@homie/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      subscriptionStatus?: {
        tier: SubscriptionTier;
        canSwipe: boolean;
        canSuperLike: boolean;
        canStartChat: boolean;
        limits: {
          dailySwipes: number;
          dailySwipesUsed: number;
          superLikesPerMonth: number;
          superLikesUsed: number;
          simultaneousChats: number;
          activeChats: number;
        };
      };
    }
  }
}

/**
 * Middleware to attach subscription status to request
 * Call this before any subscription-limited endpoint
 */
export const attachSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      next();
      return;
    }
    
    const status = await subscriptionService.getUserSubscriptionStatus(userId);
    req.subscriptionStatus = status;
    next();
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    next();
  }
};

/**
 * Middleware to require available swipes
 * Returns 429 if daily swipe limit reached
 */
export const requireSwipeLimit = async (
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
    
    const status = req.subscriptionStatus || 
      await subscriptionService.getUserSubscriptionStatus(userId);
    
    if (!status.canSwipe) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SWIPE_LIMIT_REACHED',
          message: `Daily swipe limit reached (${status.limits.dailySwipesUsed}/${status.limits.dailySwipes})`,
          tier: status.tier,
          upgradeUrl: '/subscription/upgrade',
        },
        data: {
          currentTier: status.tier,
          dailyLimit: status.limits.dailySwipes,
          used: status.limits.dailySwipesUsed,
          resetsAt: getNextMidnight(),
        },
      });
      return;
    }
    
    req.subscriptionStatus = status;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require available super likes
 * Returns 429 if monthly super like limit reached
 */
export const requireSuperLikeLimit = async (
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
    
    const status = req.subscriptionStatus || 
      await subscriptionService.getUserSubscriptionStatus(userId);
    
    if (!status.canSuperLike) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SUPER_LIKE_LIMIT_REACHED',
          message: `Monthly super like limit reached (${status.limits.superLikesUsed}/${status.limits.superLikesPerMonth})`,
          tier: status.tier,
          upgradeUrl: '/subscription/upgrade',
        },
        data: {
          currentTier: status.tier,
          monthlyLimit: status.limits.superLikesPerMonth,
          used: status.limits.superLikesUsed,
          resetsAt: getNextMonthStart(),
        },
      });
      return;
    }
    
    req.subscriptionStatus = status;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require available chat slots
 * Returns 429 if simultaneous chat limit reached
 */
export const requireChatLimit = async (
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
    
    const chatCheck = await subscriptionService.canStartChat(userId);
    
    if (!chatCheck.allowed) {
      res.status(429).json({
        success: false,
        error: {
          code: 'CHAT_LIMIT_REACHED',
          message: chatCheck.error,
          tier: req.subscriptionStatus?.tier || SubscriptionTier.FREE,
          upgradeUrl: '/subscription/upgrade',
        },
        data: {
          activeChats: chatCheck.currentCount,
          limit: chatCheck.limit,
          hint: 'Archive inactive conversations to free up slots',
        },
      });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require premium tier
 * Use for premium-only features
 */
export const requirePremium = async (
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
    
    const status = req.subscriptionStatus || 
      await subscriptionService.getUserSubscriptionStatus(userId);
    
    if (status.tier === SubscriptionTier.FREE) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_REQUIRED',
          message: 'This feature requires a Premium subscription',
          upgradeUrl: '/subscription/upgrade',
        },
        data: {
          currentTier: status.tier,
          requiredTier: 'premium',
          pricing: subscriptionService.getSubscriptionPricing(),
        },
      });
      return;
    }
    
    req.subscriptionStatus = status;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require pro tier
 * Use for pro-only features
 */
export const requirePro = async (
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
    
    const status = req.subscriptionStatus || 
      await subscriptionService.getUserSubscriptionStatus(userId);
    
    if (status.tier !== SubscriptionTier.PRO) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PRO_REQUIRED',
          message: 'This feature requires a Pro subscription',
          upgradeUrl: '/subscription/upgrade',
        },
        data: {
          currentTier: status.tier,
          requiredTier: 'pro',
          pricing: subscriptionService.getSubscriptionPricing(),
        },
      });
      return;
    }
    
    req.subscriptionStatus = status;
    next();
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getNextMidnight(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

function getNextMonthStart(): string {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth.toISOString();
}
