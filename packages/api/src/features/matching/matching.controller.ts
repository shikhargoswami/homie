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
        
        // MVP: Auto-approve landlord side when tenant swipes right
        // This simulates landlord acceptance - in production, landlords would 
        // review and accept/reject tenant applications
        if (!match.landlord_swiped) {
          await query(
            `UPDATE matches 
             SET landlord_swiped = true, 
                 landlord_swipe_direction = 'right',
                 landlord_swiped_at = CURRENT_TIMESTAMP,
                 status = 'active',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [match.id]
          );
          isMutualMatch = true;
          console.log(`🎉 Auto-approved mutual match! Tenant ${tenantId} and Property ${propertyId}`);
        } else if (match.landlord_swipe_direction === 'right') {
          // Landlord already swiped right - it's a mutual match
          isMutualMatch = true;
          
          // Ensure status is active
          if (match.status !== 'active') {
            await query(
              `UPDATE matches SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [match.id]
            );
          }
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
      // Note: Use explicit column selection to avoid m.status being overwritten by p.status
      matchesResult = await query(
        `SELECT 
          m.id,
          m.tenant_id,
          m.property_id,
          m.match_score,
          m.tenant_swiped,
          m.tenant_swipe_direction,
          m.tenant_swiped_at,
          m.landlord_swiped,
          m.landlord_swipe_direction,
          m.landlord_swiped_at,
          m.status as match_status,
          m.created_at,
          m.updated_at,
          p.address,
          p.neighborhood,
          p.city,
          p.configuration,
          p.rent,
          p.photos,
          p.property_type,
          p.furnishing,
          p.size_sqft,
          p.amenities,
          p.status as property_status,
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
          m.id,
          m.tenant_id,
          m.property_id,
          m.match_score,
          m.tenant_swiped,
          m.tenant_swipe_direction,
          m.tenant_swiped_at,
          m.landlord_swiped,
          m.landlord_swipe_direction,
          m.landlord_swiped_at,
          m.status as match_status,
          m.created_at,
          m.updated_at,
          p.address,
          p.neighborhood,
          p.city,
          p.configuration,
          p.rent,
          p.photos,
          p.property_type,
          p.furnishing,
          p.size_sqft,
          p.amenities,
          p.status as property_status,
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
 * Landlord responds to tenant interest (accept/reject)
 * 
 * POST /api/matches/:matchId/respond
 */
export const respondToMatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const landlordId = req.userId;
    const userRole = req.userRole;
    const { matchId } = req.params;
    const { response } = req.body; // 'accept' or 'reject'
    
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
        error: { code: 'FORBIDDEN', message: 'Only landlords can respond to matches' },
      });
      return;
    }
    
    if (!['accept', 'reject'].includes(response)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESPONSE', message: 'Response must be accept or reject' },
      });
      return;
    }
    
    // Verify the match belongs to landlord's property
    const matchResult = await query(
      `SELECT m.*, p.landlord_id, p.address as property_address
       FROM matches m
       JOIN properties p ON m.property_id = p.id
       WHERE m.id = $1`,
      [matchId]
    );
    
    if (matchResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Match not found' },
      });
      return;
    }
    
    const match = matchResult.rows[0];
    
    if (match.landlord_id !== landlordId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This match is not for your property' },
      });
      return;
    }
    
    if (match.landlord_swiped) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_RESPONDED', message: 'You have already responded to this match' },
      });
      return;
    }
    
    // Update match with landlord response
    const newStatus = response === 'accept' ? 'active' : 'declined';
    const swipeDirection = response === 'accept' ? 'right' : 'left';
    
    await query(
      `UPDATE matches 
       SET landlord_swiped = true,
           landlord_swipe_direction = $1,
           landlord_swiped_at = CURRENT_TIMESTAMP,
           status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [swipeDirection, newStatus, matchId]
    );
    
    const isMutualMatch = response === 'accept';
    
    console.log(`📋 Landlord ${landlordId} ${response}ed match ${matchId} for property ${match.property_address}`);
    
    res.status(200).json({
      success: true,
      data: {
        message: response === 'accept' ? 'Tenant accepted! You can now chat.' : 'Tenant declined.',
        isMutualMatch,
        matchId,
        newStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get interested tenants (tenants who swiped right but landlord hasn't responded)
 * 
 * GET /api/matches/interested-tenants
 */
export const getInterestedTenants = async (
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
        error: { code: 'FORBIDDEN', message: 'Only landlords can view interested tenants' },
      });
      return;
    }
    
    const result = await query(
      `SELECT 
        m.id as match_id,
        m.match_score,
        m.created_at as interested_at,
        p.id as property_id,
        p.address as property_address,
        p.neighborhood,
        p.configuration,
        p.rent,
        u.id as tenant_id,
        u.name as tenant_name,
        u.phone as tenant_phone,
        tp.employment_status,
        tp.company_name,
        tp.lifestyle_tags
       FROM matches m
       JOIN properties p ON m.property_id = p.id
       JOIN users u ON m.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       WHERE p.landlord_id = $1 
         AND m.tenant_swipe_direction = 'right'
         AND (m.landlord_swiped = false OR m.landlord_swiped IS NULL)
       ORDER BY m.match_score DESC, m.created_at DESC`,
      [landlordId]
    );
    
    res.status(200).json({
      success: true,
      data: {
        count: result.rowCount,
        tenants: result.rows.map((row: any) => ({
          matchId: row.match_id,
          matchScore: row.match_score,
          interestedAt: row.interested_at,
          property: {
            id: row.property_id,
            address: row.property_address,
            neighborhood: row.neighborhood,
            configuration: row.configuration,
            rent: row.rent,
          },
          tenant: {
            id: row.tenant_id,
            name: row.tenant_name,
            phone: row.tenant_phone,
            employment: row.employment_status,
            company: row.company_name,
            lifestyle: row.lifestyle_tags,
          },
        })),
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
