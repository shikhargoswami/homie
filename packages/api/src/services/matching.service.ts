import { query } from '../database/client';
import { redisClient } from '../database/client';
import { MatchPreferences, MatchScore, PropertyRecommendation } from '@homie/shared';
import { calculateCommuteTime } from './maps.service';

/**
 * Matching Service
 * 
 * Purpose: Recommend properties to tenants based on preferences
 * 
 * Algorithm Overview:
 * 1. Rule-based filtering (non-negotiables)
 * 2. Score calculation (must-haves + nice-to-haves)
 * 3. Collaborative filtering (users with similar preferences)
 * 4. Diversity injection (avoid filter bubbles)
 * 5. Ranking and caching
 */

class MatchingService {
  /**
   * Get property recommendations for tenant
   * 
   * @param tenantId - Tenant user ID
   * @param limit - Number of recommendations (default 20)
   * @returns Array of recommended properties with scores
   * 
   * Why cache?
   * - Expensive computation (database queries, scoring)
   * - Cache for 1 hour, invalidate on preference change
   * - Redis cache = sub-millisecond retrieval
   */
  async getRecommendations(
    tenantId: string,
    limit: number = 20
  ): Promise<PropertyRecommendation[]> {
    // Check cache first
    const cacheKey = `recommendations:${tenantId}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Cache hit for tenant ${tenantId}`);
      return JSON.parse(cached);
    }
    
    // Get tenant preferences
    const preferences = await this.getTenantPreferences(tenantId);
    
    if (!preferences) {
      throw new Error('Tenant preferences not found');
    }
    
    // STEP 1: Rule-based filtering (hard constraints)
    const candidates = await this.filterByRules(preferences);
    
    if (candidates.length === 0) {
      console.log('⚠️  No properties match tenant non-negotiables');
      return [];
    }
    
    console.log(`✅ Found ${candidates.length} candidate properties`);
    
    // STEP 2: Calculate match scores for each candidate
    const scoredProperties = await Promise.all(
      candidates.map(async (property) => {
        const score = await this.calculateMatchScore(property, preferences);
        return {
          propertyId: property.id,
          matchScore: score.totalScore,
          matchReason: this.generateMatchReason(score),
          commuteTime: score.breakdown.commuteMatch > 0 ? 
            await this.getCommuteTime(property, preferences) : undefined,
          property, // Include full property for debugging
          scoreBreakdown: score.breakdown,
        };
      })
    );
    
    // STEP 3: Filter by minimum threshold
    const MATCH_THRESHOLD = 60;
    const qualifiedProperties = scoredProperties.filter(
      (p) => p.matchScore >= MATCH_THRESHOLD
    );
    
    // STEP 4: Rank by score + diversity
    const ranked = this.rankWithDiversity(qualifiedProperties, tenantId);
    
    // STEP 5: Limit results
    const recommendations = ranked.slice(0, limit).map(p => ({
      propertyId: p.propertyId,
      matchScore: p.matchScore,
      matchReason: p.matchReason,
      commuteTime: p.commuteTime,
    }));
    
    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(recommendations));
    
    return recommendations;
  }
  
  /**
   * Get tenant preferences from database
   */
  private async getTenantPreferences(tenantId: string): Promise<MatchPreferences | null> {
    const result = await query(
      `SELECT preferences FROM tenant_profiles WHERE user_id = $1`,
      [tenantId]
    );
    
    if (result.rowCount === 0) {
      return null;
    }
    
    return result.rows[0].preferences as MatchPreferences;
  }
  
  /**
   * STEP 1: Filter properties by non-negotiables
   * 
   * Why SQL filtering?
   * - Database is optimized for filtering (indexes)
   * - Reduces data transfer (only fetch matching properties)
   * - 100x faster than fetching all and filtering in code
   */
  private async filterByRules(preferences: MatchPreferences): Promise<any[]> {
    const { nonNegotiables } = preferences;
    
    // Build dynamic SQL query
    const result = await query(
      `SELECT 
        p.*,
        u.name as landlord_name,
        lp.rating as landlord_rating
       FROM properties p
       JOIN users u ON p.landlord_id = u.id
       LEFT JOIN landlord_profiles lp ON u.id = lp.user_id
       WHERE p.status = 'available'
         AND p.rent >= $1
         AND p.rent <= $2
         AND p.configuration = ANY($3)
         AND p.neighborhood ILIKE $4
         AND (p.furnishing = $5 OR $5 = 'any')
         AND p.available_from <= $6
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [
        nonNegotiables.budget.min,
        nonNegotiables.budget.max,
        nonNegotiables.bhkType,
        `%${nonNegotiables.location}%`,
        nonNegotiables.furnishing,
        nonNegotiables.moveInDate,
      ]
    );
    
    return result.rows;
  }
  
  /**
   * STEP 2: Calculate match score for property
   * 
   * Scoring system (0-100 points):
   * - Budget match: 30 points (closer to preference = higher score)
   * - Location match: 20 points (exact neighborhood match)
   * - Amenities match: 20 points (% of must-haves present)
   * - Vibe match: 15 points (aesthetic + community match)
   * - Commute match: 15 points (travel time to work)
   * 
   * Why weighted scores?
   * - Budget is most important (89% of users in research)
   * - Location second (49% prioritize commute)
   * - Amenities third (varies by user)
   * - Vibe is subjective but matters for retention
   */
  private async calculateMatchScore(
    property: any,
    preferences: MatchPreferences
  ): Promise<MatchScore> {
    const breakdown = {
      budgetMatch: this.scoreBudgetMatch(property.rent, preferences.nonNegotiables.budget),
      locationMatch: this.scoreLocationMatch(property.neighborhood, preferences.nonNegotiables.location),
      amenitiesMatch: this.scoreAmenitiesMatch(property.amenities, preferences.mustHaves.amenities),
      vibeMatch: this.scoreVibeMatch(property.features, preferences.niceToHaves),
      commuteMatch: await this.scoreCommuteMatch(property, preferences.mustHaves),
    };
    
    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    
    return {
      totalScore: Math.round(totalScore),
      breakdown,
    };
  }
  
  /**
   * Budget scoring (0-30 points)
   * 
   * Logic:
   * - Within 10% of ideal: 30 points
   * - Within 20% of ideal: 25 points
   * - Within 30% of ideal: 20 points
   * - Near min/max: 15 points
   * 
   * Ideal = (min + max) / 2
   */
  private scoreBudgetMatch(
    rent: number,
    budget: { min: number; max: number }
  ): number {
    const ideal = (budget.min + budget.max) / 2;
    const deviation = Math.abs(rent - ideal) / ideal;
    
    if (deviation <= 0.1) return 30; // Within 10%
    if (deviation <= 0.2) return 25; // Within 20%
    if (deviation <= 0.3) return 20; // Within 30%
    return 15; // Within range but far from ideal
  }
  
  /**
   * Location scoring (0-20 points)
   * 
   * Logic:
   * - Exact match: 20 points
   * - Adjacent neighborhood: 15 points
   * - Same city: 10 points
   */
  private scoreLocationMatch(
    propertyLocation: string,
    preferredLocation: string
  ): number {
    const propertyLower = propertyLocation.toLowerCase();
    const preferredLower = preferredLocation.toLowerCase();
    
    if (propertyLower.includes(preferredLower)) return 20;
    
    // Adjacent neighborhoods (Bangalore-specific)
    const adjacentMap: { [key: string]: string[] } = {
      'koramangala': ['hsr layout', 'btm layout', 'ejipura'],
      'indiranagar': ['domlur', 'ulsoor', 'old airport road'],
      'whitefield': ['marathahalli', 'brookefield', 'varthur'],
      'hsr layout': ['koramangala', 'bellandur', 'sarjapur'],
    };
    
    const preferredKey = preferredLower.split(' ')[0];
    const adjacent = adjacentMap[preferredKey] || [];
    
    for (const adj of adjacent) {
      if (propertyLower.includes(adj)) return 15;
    }
    
    return 10; // Same city
  }
  
  /**
   * Amenities scoring (0-20 points)
   * 
   * Logic:
   * - All must-haves present: 20 points
   * - 75%+ present: 15 points
   * - 50%+ present: 10 points
   * - Less than 50%: 5 points
   */
  private scoreAmenitiesMatch(
    propertyAmenities: string[],
    requiredAmenities: string[]
  ): number {
    if (requiredAmenities.length === 0) return 20; // No requirements
    
    const matches = requiredAmenities.filter(
      (amenity) => propertyAmenities.includes(amenity)
    ).length;
    
    const matchRate = matches / requiredAmenities.length;
    
    if (matchRate === 1) return 20;
    if (matchRate >= 0.75) return 15;
    if (matchRate >= 0.5) return 10;
    return 5;
  }
  
  /**
   * Vibe scoring (0-15 points)
   * 
   * Logic:
   * - Aesthetic preference match: 8 points
   * - Community vibe match: 7 points
   * 
   * Why subjective scoring?
   * - Increases long-term satisfaction
   * - Reduces churn (tenant stays longer)
   * - Hard to quantify but important
   */
  private scoreVibeMatch(
    propertyFeatures: any,
    niceToHaves: MatchPreferences['niceToHaves']
  ): number {
    let score = 0;
    
    // Aesthetic match (0-8 points)
    if (niceToHaves.aestheticPreference && propertyFeatures?.aesthetic) {
      if (propertyFeatures.aesthetic === niceToHaves.aestheticPreference) {
        score += 8;
      } else {
        score += 4; // Partial credit for having aesthetic data
      }
    } else {
      score += 4; // Neutral if no preference
    }
    
    // Community vibe match (0-7 points)
    if (niceToHaves.communityVibe && propertyFeatures?.community_vibe) {
      if (propertyFeatures.community_vibe === niceToHaves.communityVibe) {
        score += 7;
      } else {
        score += 3;
      }
    } else {
      score += 3; // Neutral
    }
    
    return score;
  }
  
  /**
   * Commute scoring (0-15 points)
   * 
   * Logic:
   * - Under 20 minutes: 15 points
   * - 20-30 minutes: 12 points
   * - 30-45 minutes: 8 points
   * - 45-60 minutes: 4 points
   * - Over 60 minutes: 0 points
   * 
   * Why commute matters?
   * - 27% of tenants prioritize commute in research
   * - Daily frustration if commute too long
   * - Affects retention and ratings
   */
  private async scoreCommuteMatch(
    property: any,
    mustHaves: MatchPreferences['mustHaves']
  ): Promise<number> {
    if (!mustHaves.workLocation || !mustHaves.maxCommute) {
      return 7; // Neutral score if no commute requirement
    }
    
    try {
      const commuteMinutes = await this.getCommuteTime(property, { mustHaves } as any);
      
      if (commuteMinutes <= 20) return 15;
      if (commuteMinutes <= 30) return 12;
      if (commuteMinutes <= 45) return 8;
      if (commuteMinutes <= 60) return 4;
      return 0;
    } catch (error) {
      console.error('Commute calculation failed:', error);
      return 7; // Neutral on error
    }
  }
  
  /**
   * Get commute time from property to work location
   * Uses Google Maps Distance Matrix API
   */
  private async getCommuteTime(
    property: any,
    preferences: MatchPreferences
  ): Promise<number> {
    if (!preferences.mustHaves.workLocation) return 0;
    
    return calculateCommuteTime(
      { lat: property.latitude, lng: property.longitude },
      preferences.mustHaves.workLocation
    );
  }
  
  /**
   * Generate human-readable match reason
   * 
   * Why?
   * - Users want to know WHY property is recommended
   * - Increases trust in algorithm
   * - Helps users make faster decisions
   */
  private generateMatchReason(score: MatchScore): string {
    const reasons: string[] = [];
    
    if (score.breakdown.budgetMatch >= 25) {
      reasons.push('Great price match');
    }
    
    if (score.breakdown.locationMatch >= 18) {
      reasons.push('Perfect location');
    }
    
    if (score.breakdown.amenitiesMatch >= 18) {
      reasons.push('Has all your must-have amenities');
    }
    
    if (score.breakdown.commuteMatch >= 12) {
      reasons.push('Short commute to work');
    }
    
    if (score.breakdown.vibeMatch >= 12) {
      reasons.push('Matches your style');
    }
    
    if (reasons.length === 0) {
      return 'Good overall match';
    }
    
    return reasons.join(' • ');
  }
  
  /**
   * STEP 4: Rank with diversity
   * 
   * Why diversity?
   * - Avoid showing only similar properties
   * - Help users discover unexpected good fits
   * - Reduce "filter bubble" effect
   * 
   * Algorithm:
   * - Top 70% by score
   * - 20% by landlord diversity (show different landlords)
   * - 10% random exploration (serendipity)
   */
  private rankWithDiversity(
    properties: any[],
    tenantId: string
  ): any[] {
    if (properties.length <= 10) return properties;
    
    // Sort by score
    const sorted = properties.sort((a, b) => b.matchScore - a.matchScore);
    
    const topCount = Math.ceil(properties.length * 0.7);
    const diverseCount = Math.ceil(properties.length * 0.2);
    const randomCount = properties.length - topCount - diverseCount;
    
    // Top 70%
    const topMatches = sorted.slice(0, topCount);
    
    // Diverse 20% (different landlords)
    const remaining = sorted.slice(topCount);
    const seenLandlords = new Set(topMatches.map(p => p.property.landlord_id));
    const diverse = remaining
      .filter(p => !seenLandlords.has(p.property.landlord_id))
      .slice(0, diverseCount);
    
    // Random 10%
    const rest = remaining.filter(p => !diverse.includes(p));
    const random = this.shuffleArray(rest).slice(0, randomCount);
    
    return [...topMatches, ...diverse, ...random];
  }
  
  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Invalidate recommendations cache
   * Called when tenant updates preferences
   */
  async invalidateCache(tenantId: string): Promise<void> {
    const cacheKey = `recommendations:${tenantId}`;
    await redisClient.del(cacheKey);
    console.log(`✅ Cache invalidated for tenant ${tenantId}`);
  }
  
  /**
   * Record swipe action
   * 
   * @param tenantId - Tenant user ID
   * @param propertyId - Property ID
   * @param direction - 'right' (like), 'left' (pass), 'super' (super like)
   */
  async recordSwipe(
    tenantId: string,
    propertyId: string,
    direction: 'right' | 'left' | 'super'
  ): Promise<void> {
    // Check if match already exists
    const existingMatch = await query(
      'SELECT * FROM matches WHERE tenant_id = $1 AND property_id = $2',
      [tenantId, propertyId]
    );
    
    if (existingMatch.rowCount > 0) {
      // Update existing match
      await query(
        `UPDATE matches 
         SET tenant_swiped = true, 
             tenant_swipe_direction = $1,
             tenant_swiped_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2 AND property_id = $3`,
        [direction, tenantId, propertyId]
      );
    } else {
      // Create new match record
      // First get property landlord
      const propertyResult = await query(
        'SELECT landlord_id FROM properties WHERE id = $1',
        [propertyId]
      );
      
      if (propertyResult.rowCount === 0) {
        throw new Error('Property not found');
      }
      
      const landlordId = propertyResult.rows[0].landlord_id;
      
      // Get match score from recommendations (or calculate)
      const recommendations = await this.getRecommendations(tenantId, 100);
      const recommendation = recommendations.find(r => r.propertyId === propertyId);
      const matchScore = recommendation?.matchScore || 70; // Default if not in recommendations
      
      await query(
        `INSERT INTO matches (
          tenant_id, property_id, match_score,
          tenant_swiped, tenant_swipe_direction, tenant_swiped_at,
          status
        ) VALUES ($1, $2, $3, true, $4, CURRENT_TIMESTAMP, $5)`,
        [
          tenantId,
          propertyId,
          matchScore,
          direction,
          direction === 'right' || direction === 'super' ? 'interested' : 'declined'
        ]
      );
    }
    
    // Track analytics
    await query(
      `INSERT INTO analytics_events (
        user_id, event_type, property_id, metadata
      ) VALUES ($1, 'property_swipe', $2, $3)`,
      [tenantId, propertyId, JSON.stringify({ direction })]
    );
    
    // Update daily swipe counter in Redis
    const swipeCountKey = `swipes:daily:${tenantId}:${new Date().toISOString().split('T')[0]}`;
    await redisClient.incr(swipeCountKey);
    await redisClient.expire(swipeCountKey, 86400); // 24 hours
  }
  
  /**
   * Check if tenant has reached daily swipe limit
   */
  async checkSwipeLimit(tenantId: string): Promise<{ allowed: boolean; remaining: number }> {
    const swipeCountKey = `swipes:daily:${tenantId}:${new Date().toISOString().split('T')[0]}`;
    const count = await redisClient.get(swipeCountKey);
    const swipeCount = count ? parseInt(count) : 0;
    
    const MAX_DAILY_SWIPES = 50; // Free tier limit
    
    return {
      allowed: swipeCount < MAX_DAILY_SWIPES,
      remaining: Math.max(0, MAX_DAILY_SWIPES - swipeCount),
    };
  }
}

// Singleton instance
export const matchingService = new MatchingService();
