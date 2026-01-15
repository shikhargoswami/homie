import { Request, Response, NextFunction } from 'express';
import { landlordSwipeService } from '../services/landlord-swipe.service';

/**
 * Landlord Swipe Controller
 * 
 * Endpoints:
 * - GET /api/landlord/swipe/feed - Get tenant swipe feed
 * - POST /api/landlord/swipe - Record landlord swipe on a tenant
 * - GET /api/landlord/swipe/count - Get pending swipe count
 */

/**
 * Get tenant swipe feed for landlord
 * 
 * GET /api/landlord/swipe/feed?limit=20
 * 
 * Returns tenant profile cards for swiping:
 * - Photo, work location, lifestyle tags, budget
 * - Match score with reason (e.g., "82% Match - Works nearby, pet-friendly")
 */
export const getTenantSwipeFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const userRole = req.userRole;

    console.log('[getTenantSwipeFeed] landlordId:', landlordId, 'userRole:', userRole);

    if (!landlordId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (userRole !== 'landlord') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlords can access tenant swipe feed' },
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    
    const tenants = await landlordSwipeService.getTenantSwipeFeed(landlordId, limit);
    const pendingCount = await landlordSwipeService.getPendingSwipeCount(landlordId);

    res.status(200).json({
      success: true,
      data: {
        tenants,
        totalPending: pendingCount,
        count: tenants.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record landlord swipe on a tenant
 * 
 * POST /api/landlord/swipe
 * Body: { matchId: "...", direction: "right" | "left" }
 * 
 * - Swipe right: "Interested" → Tenant notified
 * - Swipe left: "Not suitable"
 * - Mutual match = Unlock chat
 */
export const recordLandlordSwipe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const userRole = req.userRole;
    const { matchId, direction } = req.body;

    if (!landlordId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (userRole !== 'landlord') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlords can swipe on tenants' },
      });
      return;
    }

    // Validate inputs
    if (!matchId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Match ID is required' },
      });
      return;
    }

    if (!direction || !['right', 'left'].includes(direction)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DIRECTION', message: 'Direction must be "right" or "left"' },
      });
      return;
    }

    const result = await landlordSwipeService.recordSwipe(landlordId, matchId, direction);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'SWIPE_FAILED', message: result.message },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        matchId: result.matchId,
        isMutualMatch: result.isMutualMatch,
        chatUnlocked: result.chatUnlocked,
        message: result.message,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending swipe count
 * 
 * GET /api/landlord/swipe/count
 * 
 * Returns the number of tenants waiting for landlord response
 */
export const getPendingSwipeCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const userRole = req.userRole;

    if (!landlordId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (userRole !== 'landlord') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlords can access this endpoint' },
      });
      return;
    }

    const count = await landlordSwipeService.getPendingSwipeCount(landlordId);

    res.status(200).json({
      success: true,
      data: {
        pendingCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk decline pending swipes for a property
 * 
 * POST /api/landlord/swipe/decline-all/:propertyId
 * 
 * Useful when property is rented - decline all waiting tenants
 */
export const declineAllPendingSwipes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const userRole = req.userRole;
    const { propertyId } = req.params;

    if (!landlordId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (userRole !== 'landlord') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlords can perform this action' },
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Property ID is required' },
      });
      return;
    }

    const declinedCount = await landlordSwipeService.declineAllPendingForProperty(propertyId);

    res.status(200).json({
      success: true,
      data: {
        declinedCount,
        message: `Declined ${declinedCount} pending tenant interest(s)`,
      },
    });
  } catch (error) {
    next(error);
  }
};
