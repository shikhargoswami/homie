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
