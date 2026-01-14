import { Request, Response, NextFunction } from 'express';
import { matchingService } from '../services/matching.service';
import { lifestyleMatchingService } from '../services/lifestyle.matching.service';
import { subscriptionService } from '../services/subscription.service';
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
    const includeLifestyle = req.query.lifestyle !== 'false'; // Include lifestyle by default
    
    // Check subscription status and swipe limits
    const subscriptionStatus = await subscriptionService.getUserSubscriptionStatus(tenantId);
    
    if (!subscriptionStatus.canSwipe) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SWIPE_LIMIT_REACHED',
          message: 'Daily swipe limit reached. Upgrade to premium for more swipes.',
          upgradeRequired: subscriptionStatus.upgradeRequired,
          tier: subscriptionStatus.tier,
        },
      });
      return;
    }
    
    // Get base recommendations
    const recommendations = await matchingService.getRecommendations(tenantId, limit);
    
    // Enhance with lifestyle scoring if enabled
    let enhancedRecommendations: any[] = recommendations;
    if (includeLifestyle && recommendations.length > 0) {
      enhancedRecommendations = await lifestyleMatchingService.getLifestyleRecommendations(
        tenantId,
        recommendations.map(r => ({ propertyId: r.propertyId, matchScore: r.matchScore }))
      );
    }
    
    // Get full property details
    const propertyIds = enhancedRecommendations.map(r => r.propertyId);
    
    if (propertyIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          properties: [],
          remaining: subscriptionStatus.limits.dailySwipes - subscriptionStatus.limits.dailySwipesUsed,
          subscription: {
            tier: subscriptionStatus.tier,
            limits: subscriptionStatus.limits,
          },
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
    
    // Merge recommendations with property details and generate match highlights
    const properties = propertiesResult.rows.map((property: any) => {
      const recommendation = enhancedRecommendations.find(r => r.propertyId === property.id);
      
      // Generate match highlights for card display
      const match_highlights: string[] = [];
      
      // Commute highlight
      if ((recommendation as any)?.commuteTime) {
        match_highlights.push(`🚗 ${(recommendation as any).commuteTime} min to work`);
      } else if (property.commute_matrix) {
        // Use commute matrix to show nearest tech park
        const commuteData = property.commute_matrix;
        const entries = Object.entries(commuteData);
        if (entries.length > 0) {
          const sorted = entries.sort((a: any, b: any) => a[1] - b[1]);
          const [location, time] = sorted[0];
          const locationName = location.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          match_highlights.push(`🚗 ${time} min to ${locationName}`);
        }
      }
      
      // Sunlight highlight
      if (property.sunlight_hours) {
        const avgSunlight = Object.values(property.sunlight_hours as Record<string, number>).reduce(
          (sum: number, val: number) => sum + val, 0
        ) / Object.keys(property.sunlight_hours).length;
        if (avgSunlight >= 6) {
          match_highlights.push(`☀️ ${Math.round(avgSunlight)}h sunlight daily`);
        }
      }
      
      // Pet highlight
      if (property.pet_details?.dogs_allowed || property.pet_details?.cats_allowed) {
        const pets = [];
        if (property.pet_details.dogs_allowed) pets.push('dogs');
        if (property.pet_details.cats_allowed) pets.push('cats');
        match_highlights.push(`🐾 ${pets.join(' & ')} welcome`);
      }
      
      // Quiet area highlight
      if (property.noise_levels?.morning && property.noise_levels.morning <= 45) {
        match_highlights.push(`🤫 Quiet mornings (${property.noise_levels.morning}dB)`);
      }
      
      // Metro proximity highlight
      if (property.neighborhood_pois?.metro_distance_m && property.neighborhood_pois.metro_distance_m <= 800) {
        const walkMins = Math.round(property.neighborhood_pois.metro_distance_m / 80);
        match_highlights.push(`🚇 Metro ${walkMins} min walk`);
      }
      
      // Check if property is new (created within last 7 days)
      const isNew = property.created_at && 
        new Date(property.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return {
        ...property,
        matchScore: (recommendation as any)?.combinedScore || (recommendation as any)?.matchScore,
        lifestyleScore: (recommendation as any)?.lifestyleScore,
        matchReason: (recommendation as any)?.matchReason,
        lifestyleInsights: (recommendation as any)?.insights,
        commuteTime: (recommendation as any)?.commuteTime,
        match_highlights: match_highlights.slice(0, 3), // Max 3 highlights
        is_new: isNew,
      };
    });
    
    // Sort by combined score
    properties.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));
    
    res.status(200).json({
      success: true,
      data: {
        properties,
        remaining: subscriptionStatus.limits.dailySwipes - subscriptionStatus.limits.dailySwipesUsed,
        subscription: {
          tier: subscriptionStatus.tier,
          limits: subscriptionStatus.limits,
        },
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
    
    // Record swipe with subscription service (handles limits)
    const isSuperLike = direction === 'super';
    const swipeResult = await subscriptionService.recordSwipe(tenantId, isSuperLike);
    
    if (!swipeResult.success) {
      res.status(429).json({
        success: false,
        error: {
          code: isSuperLike ? 'SUPER_LIKE_LIMIT_REACHED' : 'SWIPE_LIMIT_REACHED',
          message: swipeResult.error,
        },
      });
      return;
    }
    
    // Record swipe in matches table
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
      
      if (matchResult.rowCount && matchResult.rowCount > 0) {
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
        remaining: swipeResult.remaining,
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
