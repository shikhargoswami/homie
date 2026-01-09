import express from 'express';
import {
  getRecommendations,
  recordSwipe,
  getMutualMatches,
  getMatchStats,
} from '../controllers/matching.controller';
import { authenticate, authorize } from '../middleware/auth';

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
  authorize(['tenant']),
  getRecommendations
);

// Record swipe action (tenant only)
router.post(
  '/swipe',
  authenticate,
  authorize(['tenant']),
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

export default router;
