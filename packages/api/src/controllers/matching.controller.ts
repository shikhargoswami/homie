import { Request, Response, NextFunction } from 'express';
import { matchingService } from '../services/matching.service';
import { query } from '../database/client';

/**
 * Matching Controller
 * 
 * Endpoints:
 * - GET /api/matches/recommendations - Get property recommendations
 * - POST /api/matches/swipe - Record swipe action
 * - GET /api/matches/mutual - Get mutual matches (both swiped right)
 * - GET /api/matches/stats - Get matching statistics
 */

/**
 * Get property recommendations for tenant
 * 
 * GET /api/matches/recommendations?limit=20
 */
export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.userId;
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Check swipe limit
    const swipeLimit = await matchingService.checkSwipeLimit(tenantId);
    
    if (!swipeLimit.allowed) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SWIPE_LIMIT_REACHED',
          message: 'Daily swipe limit reached. Upgrade to premium for unlimited swipes.',
        },
      });
      return;
    }
    
    // Get recommendations
    const recommendations = await matchingService.getRecommendations(tenantId, limit);
    
    // Get full property details
    const propertyIds = recommendations.map(r => r.propertyId);
    
    if (propertyIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          properties: [],
          remaining: swipeLimit.remaining,
        },
      });
      return;
    }
    
    const propertiesResult = await query(
      `SELECT 
        p.*,
        u.name as landlord_name,
        lp.rating as landlord_rating,
        lp.total_tenants as landlord_total_tenants
       FROM properties p
       JOIN users u ON p.landlord_id = u.id
       LEFT JOIN landlord_profiles lp ON u.id = lp.user_id
       WHERE p.id = ANY($1)`,
      [propertyIds]
    );
    
    // Merge recommendations with property details
    const properties = propertiesResult.rows.map((property: { id: any; }) => {
      const recommendation = recommendations.find(r => r.propertyId === property.id);
      return {
        ...property,
        matchScore: recommendation?.matchScore,
        matchReason: recommendation?.matchReason,
        commuteTime: recommendation?.commuteTime,
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        properties,
        remaining: swipeLimit.remaining,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record swipe action
 * 
 * POST /api/matches/swipe
 * Body: { propertyId: "...", direction: "right" | "left" | "super" }
 */
export const recordSwipe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.userId;
    const { propertyId, direction } = req.body;
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    // Validate inputs
    if (!propertyId || !direction) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Property ID and direction required' },
      });
      return;
    }
    
    if (!['right', 'left', 'super'].includes(direction)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DIRECTION', message: 'Direction must be right, left, or super' },
      });
      return;
    }
    
    // Check swipe limit
    const swipeLimit = await matchingService.checkSwipeLimit(tenantId);
    
    if (!swipeLimit.allowed) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SWIPE_LIMIT_REACHED',
          message: 'Daily swipe limit reached',
        },
      });
      return;
    }
    
    // Record swipe
    await matchingService.recordSwipe(tenantId, propertyId, direction);
    
    // Check if mutual match (both swiped right)
    let isMutualMatch = false;
    
    if (direction === 'right' || direction === 'super') {
      const matchResult = await query(
        `SELECT m.*, p.landlord_id
         FROM matches m
         JOIN properties p ON m.property_id = p.id
         WHERE m.tenant_id = $1 AND m.property_id = $2`,
        [tenantId, propertyId]
      );
      
      if (matchResult.rowCount > 0) {
        const match = matchResult.rows[0];
        
        // Check if landlord also swiped right (we'll implement landlord swipe later)
        // For now, just mark as interested
        isMutualMatch = match.landlord_swiped && match.landlord_swipe_direction === 'right';
        
        if (isMutualMatch) {
          // Update match status
          await query(
            `UPDATE matches SET status = 'active' WHERE id = $1`,
            [match.id]
          );
          
          // Send notification (implement later)
          console.log(`🎉 Mutual match! Tenant ${tenantId} and Property ${propertyId}`);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Swipe recorded',
        isMutualMatch,
        remaining: swipeLimit.remaining - 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mutual matches (both tenant and landlord swiped right)
 * 
 * GET /api/matches/mutual
 */
export const getMutualMatches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    
    let matchesResult;
    
    if (userRole === 'tenant') {
      // Get matches where tenant is current user and status is active
      matchesResult = await query(
        `SELECT 
          m.*,
          p.*,
          u.name as landlord_name,
          u.phone as landlord_phone
         FROM matches m
         JOIN properties p ON m.property_id = p.id
         JOIN users u ON p.landlord_id = u.id
         WHERE m.tenant_id = $1 AND m.status = 'active'
         ORDER BY m.updated_at DESC`,
        [userId]
      );
    } else if (userRole === 'landlord') {
      // Get matches where landlord owns the property and status is active
      matchesResult = await query(
        `SELECT 
          m.*,
          p.*,
          u.name as tenant_name,
          u.phone as tenant_phone,
          tp.employment_status,
          tp.company_name
         FROM matches m
         JOIN properties p ON m.property_id = p.id
         JOIN users u ON m.tenant_id = u.id
         LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
         WHERE p.landlord_id = $1 AND m.status = 'active'
         ORDER BY m.updated_at DESC`,
        [userId]
      );
    } else {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid role' },
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: {
        matches: matchesResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get matching statistics
 * 
 * GET /api/matches/stats
 */
export const getMatchStats = async (
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
    
    // Get swipe statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE tenant_swipe_direction = 'right') as right_swipes,
        COUNT(*) FILTER (WHERE tenant_swipe_direction = 'left') as left_swipes,
        COUNT(*) FILTER (WHERE tenant_swipe_direction = 'super') as super_likes,
        COUNT(*) FILTER (WHERE status = 'active') as mutual_matches
       FROM matches
       WHERE tenant_id = $1`,
      [userId]
    );
    
    const stats = statsResult.rows[0];
    
    // Get daily swipe count
    const swipeLimit = await matchingService.checkSwipeLimit(userId);
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          rightSwipes: parseInt(stats.right_swipes) || 0,
          leftSwipes: parseInt(stats.left_swipes) || 0,
          superLikes: parseInt(stats.super_likes) || 0,
          mutualMatches: parseInt(stats.mutual_matches) || 0,
          todayRemaining: swipeLimit.remaining,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
