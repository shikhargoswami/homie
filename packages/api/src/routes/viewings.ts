import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  scheduleViewing,
  getTenantViewings,
  getLandlordViewings,
  confirmViewing,
  rescheduleViewing,
  acceptCounterProposal,
  cancelViewing,
  completeViewing,
  markNoShow,
} from '../controllers/viewing.controller';

const router = express.Router();

// Apply auth middleware to all viewing routes
router.use(authenticate);

/**
 * Viewing Routes (User Journey Flow)
 * 
 * POST /api/viewings - Schedule a viewing (tenant proposes time)
 * PATCH /api/viewings/:id/confirm - Confirm viewing (landlord approves)
 * PATCH /api/viewings/:id/reschedule - Counter-propose new time (landlord)
 * PATCH /api/viewings/:id/accept - Accept counter-proposal (tenant)
 * PATCH /api/viewings/:id/cancel - Cancel viewing (either party)
 * PATCH /api/viewings/:id/complete - Mark as completed (after visit)
 * PATCH /api/viewings/:id/no-show - Mark as no-show
 */
router.post('/', scheduleViewing);
router.patch('/:id/confirm', confirmViewing);
router.patch('/:id/reschedule', rescheduleViewing);
router.patch('/:id/accept', acceptCounterProposal);
router.patch('/:id/cancel', cancelViewing);
router.patch('/:id/complete', completeViewing);
router.patch('/:id/no-show', markNoShow);

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
