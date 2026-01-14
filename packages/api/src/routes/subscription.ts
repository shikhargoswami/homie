/**
 * Subscription Routes
 * 
 * Endpoints:
 * - GET /api/subscription/status - Get current subscription
 * - GET /api/subscription/plans - Get available plans
 * - POST /api/subscription/upgrade - Upgrade subscription
 * - POST /api/subscription/cancel - Cancel subscription
 * - GET /api/subscription/usage - Get usage history
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { attachSubscriptionStatus } from '../middleware/subscription';
import {
  getSubscriptionStatus,
  getSubscriptionPlans,
  upgradeSubscription,
  cancelSubscription,
  getUsageHistory,
} from '../controllers/subscription.controller';

const router = Router();

// Public endpoint - view plans without auth
router.get('/plans', getSubscriptionPlans);

// Protected endpoints - require authentication
router.get('/status', authenticate, attachSubscriptionStatus, getSubscriptionStatus);
router.post('/upgrade', authenticate, attachSubscriptionStatus, upgradeSubscription);
router.post('/cancel', authenticate, cancelSubscription);
router.get('/usage', authenticate, getUsageHistory);

export default router;
