import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  scheduleViewing,
  getTenantViewings,
  getLandlordViewings,
  confirmViewing,
  cancelViewing,
} from '../controllers/viewing.controller';

const router = express.Router();

// Apply auth middleware to all viewing routes
router.use(authenticate);

/**
 * Viewing Routes
 * POST /api/viewings - Schedule a viewing (tenant)
 * PATCH /api/viewings/:id/confirm - Confirm viewing (landlord)
 * PATCH /api/viewings/:id/cancel - Cancel viewing
 */
router.post('/', scheduleViewing);
router.patch('/:id/confirm', confirmViewing);
router.patch('/:id/cancel', cancelViewing);

export default router;

/**
 * Tenant viewing routes (mounted at /api/tenant)
 */
export const tenantViewingRoutes = express.Router();
tenantViewingRoutes.use(authenticate);
tenantViewingRoutes.get('/viewings', getTenantViewings);

/**
 * Landlord viewing routes (mounted at /api/landlord)
 */
export const landlordViewingRoutes = express.Router();
landlordViewingRoutes.use(authenticate);
landlordViewingRoutes.get('/viewings', getLandlordViewings);
