import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  searchProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  getLandlordProperties,
  getLandlordStats,
  getPendingRequests,
  getRecentMatches,
} from '../controllers/property.controller';
import {
  getTenantSwipeFeed,
  recordLandlordSwipe,
  getPendingSwipeCount,
  declineAllPendingSwipes,
} from '../controllers/landlord-swipe.controller';
import {
  getVerificationStatus,
  sendEmailVerification,
  verifyEmailOtp,
  submitIdVerification,
  submitPropertyDocuments,
  skipVerification,
  getVerificationBadges,
} from '../controllers/landlord-verification.controller';

const router = express.Router();

/**
 * Public Property Routes
 * GET /api/properties - Search properties
 * GET /api/properties/:id - Get property details
 */
router.get('/', optionalAuth, searchProperties);
router.get('/:id', optionalAuth, getPropertyById);

export default router;

/**
 * Landlord Property Routes (separate export for mounting at /api/landlord)
 */
export const landlordRoutes = express.Router();

// Apply auth middleware to all landlord routes
landlordRoutes.use(authenticate);

// Property management
landlordRoutes.get('/properties', getLandlordProperties);
landlordRoutes.post('/properties', createProperty);
landlordRoutes.put('/properties/:id', updateProperty);
landlordRoutes.delete('/properties/:id', deleteProperty);
landlordRoutes.patch('/properties/:id/status', updatePropertyStatus);

// Dashboard endpoints
landlordRoutes.get('/stats', getLandlordStats);
landlordRoutes.get('/pending-requests', getPendingRequests);
landlordRoutes.get('/recent-matches', getRecentMatches);

// Landlord Swipe Feature - Tenant Swipe Feed (Two-sided matching)
landlordRoutes.get('/swipe/feed', getTenantSwipeFeed);
landlordRoutes.post('/swipe', recordLandlordSwipe);
landlordRoutes.get('/swipe/count', getPendingSwipeCount);
landlordRoutes.post('/swipe/decline-all/:propertyId', declineAllPendingSwipes);

// Landlord Verification Routes
landlordRoutes.get('/verification/status', getVerificationStatus);
landlordRoutes.post('/verification/email/send', sendEmailVerification);
landlordRoutes.post('/verification/email/verify', verifyEmailOtp);
landlordRoutes.post('/verification/id', submitIdVerification);
landlordRoutes.post('/verification/property-docs', submitPropertyDocuments);
landlordRoutes.post('/verification/skip', skipVerification);
landlordRoutes.get('/verification/badges', getVerificationBadges);
