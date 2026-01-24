import express from 'express';
import {
  getRecommendations,
  recordSwipe,
  getMutualMatches,
  getMatchStats,
  respondToMatch,
  getInterestedTenants,
} from '../controllers/matching.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@homie/shared';

const router = express.Router();

/**
 * Matching Routes
 * 
 * All routes require authentication
 * Most routes are tenant-only
 */

// Get property recommendations (tenant only)
router.get(
  '/recommendations',
  authenticate,
  authorize([UserRole.TENANT]),
  getRecommendations
);

// Record swipe action (tenant only)
router.post(
  '/swipe',
  authenticate,
  authorize([UserRole.TENANT]),
  recordSwipe
);

// Get mutual matches (tenant and landlord)
router.get(
  '/mutual',
  authenticate,
  getMutualMatches
);

// Get matching statistics
router.get(
  '/stats',
  authenticate,
  getMatchStats
);

// Landlord: Get interested tenants (tenants who swiped right but need response)
router.get(
  '/interested-tenants',
  authenticate,
  authorize([UserRole.LANDLORD]),
  getInterestedTenants
);

// Landlord: Respond to tenant interest (accept/reject)
router.post(
  '/:matchId/respond',
  authenticate,
  authorize([UserRole.LANDLORD]),
  respondToMatch
);

export default router;
