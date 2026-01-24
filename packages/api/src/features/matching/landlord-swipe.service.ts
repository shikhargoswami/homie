import { query } from '../database/client';

/**
 * Landlord Swipe Service
 * 
 * Purpose: Provide tenant recommendations for landlord swiping
 * 
 * Features:
 * - Get interested tenants for landlord's properties (tenant swipe feed)
 * - Calculate match score between tenant and property
 * - Generate match reasons and highlights
 * - Record landlord swipes
 */

export interface TenantCard {
  tenantId: string;
  matchId: string;
  name: string;
  photo?: string;
  age?: number;
  
  // Work info
  workLocationName?: string;
  company?: string;
  occupationType?: string;
  
  // Budget
  budgetMin: number;
  budgetMax: number;
  
  // Income
  annualIncome?: number;
  
  // Lifestyle
  lifestyleTags: string[];
  
  // Match info
  matchScore: number;
  matchReason: string;
  matchHighlights: string[];
  
  // Property they're interested in
  property: {
    id: string;
    address: string;
    neighborhood: string;
    rent: number;
  };
  
  interestedAt: string;
  
  // Enhanced profile data
  isVerified: boolean;
  employmentVerified: boolean;
  incomeVerified: boolean;
  policeVerification: boolean;
  previousLandlordVerified: boolean;
  
  // Couple/Family info
  isCouple: boolean;
  partnerName?: string;
  familySize: number;
  hasChildren: boolean;
  
  // Location
  currentLocation?: string;
  
  // Rental preferences
  preferredMoveIn?: string;
  preferredLeaseMonths: number;
  lookingForDescription?: string;
  interestMessage?: string;
  
  // Rental history
  rentalHistory?: {
    landlordName: string;
    durationMonths: number;
    rating: number;
    review?: string;
    isVerified: boolean;
  };
}

export interface SwipeResult {
  success: boolean;
  isMutualMatch: boolean;
  matchId: string;
  chatUnlocked?: boolean;
  message: string;
}

class LandlordSwipeService {
  /**
   * Get tenant swipe feed for landlord
   * 
   * Returns tenants who have swiped right on landlord's properties
   * but landlord hasn't responded yet.
   * 
   * @param landlordId - Landlord user ID
   * @param limit - Number of tenants to return
   * @returns Array of tenant cards with match info
   */
  async getTenantSwipeFeed(landlordId: string, limit: number = 20): Promise<TenantCard[]> {
    // Get tenants who swiped right on landlord's properties
    const result = await query(
      `SELECT 
        m.id as match_id,
        m.match_score,
        m.match_reason,
        m.match_highlights,
        m.created_at as interested_at,
        m.tenant_swipe_direction,
        m.tenant_interest_message,
        m.tenant_move_in_date,
        m.tenant_lease_preference,
        
        -- Tenant info
        u.id as tenant_id,
        u.name as tenant_name,
        
        -- Tenant profile
        tp.photo,
        tp.age,
        tp.work_location_name,
        tp.company_name,
        tp.occupation_type,
        tp.budget_min,
        tp.budget_max,
        tp.lifestyle_tags,
        tp.work_location_lat,
        tp.work_location_lng,
        tp.annual_income,
        tp.is_verified,
        tp.employment_verified,
        tp.income_verified,
        tp.police_verification,
        tp.previous_landlord_verified,
        tp.is_couple,
        tp.partner_name,
        tp.family_size,
        tp.has_children,
        tp.current_location,
        tp.preferred_move_in,
        tp.preferred_lease_months,
        tp.interest_message,
        
        -- Property info
        p.id as property_id,
        p.address as property_address,
        p.neighborhood as property_neighborhood,
        p.rent as property_rent,
        p.latitude as property_lat,
        p.longitude as property_lng,
        
        -- Rental history (latest)
        (SELECT json_build_object(
          'landlordName', rh.landlord_name,
          'durationMonths', rh.duration_months,
          'rating', rh.rating,
          'review', rh.review_text,
          'isVerified', rh.is_verified
        ) FROM tenant_rental_history rh 
        WHERE rh.tenant_id = u.id 
        ORDER BY rh.rating DESC, rh.created_at DESC 
        LIMIT 1) as rental_history
        
       FROM matches m
       JOIN users u ON m.tenant_id = u.id
       JOIN tenant_profiles tp ON u.id = tp.user_id
       JOIN properties p ON m.property_id = p.id
       WHERE p.landlord_id = $1 
         AND m.tenant_swipe_direction = 'right'
         AND (m.landlord_swiped = false OR m.landlord_swiped IS NULL)
         AND p.status = 'available'
       ORDER BY m.match_score DESC, m.created_at DESC
       LIMIT $2`,
      [landlordId, limit]
    );

    // Transform and enhance with computed match data
    return result.rows.map((row: any) => this.transformToTenantCard(row));
  }

  /**
   * Transform database row to TenantCard
   */
  private transformToTenantCard(row: any): TenantCard {
    // Calculate match highlights if not already stored
    const highlights = row.match_highlights || this.generateMatchHighlights(row);
    const matchReason = row.match_reason || this.generateMatchReason(row, highlights);

    return {
      tenantId: row.tenant_id,
      matchId: row.match_id,
      name: row.tenant_name,
      photo: row.photo,
      age: row.age,
      
      workLocationName: row.work_location_name,
      company: row.company_name,
      occupationType: row.occupation_type,
      
      budgetMin: row.budget_min,
      budgetMax: row.budget_max,
      
      annualIncome: row.annual_income,
      
      lifestyleTags: row.lifestyle_tags || [],
      
      matchScore: row.match_score || 75,
      matchReason,
      matchHighlights: highlights,
      
      property: {
        id: row.property_id,
        address: row.property_address,
        neighborhood: row.property_neighborhood,
        rent: row.property_rent,
      },
      
      interestedAt: row.interested_at,
      
      // Enhanced profile data
      isVerified: row.is_verified || false,
      employmentVerified: row.employment_verified || false,
      incomeVerified: row.income_verified || false,
      policeVerification: row.police_verification || false,
      previousLandlordVerified: row.previous_landlord_verified || false,
      
      // Couple/Family info
      isCouple: row.is_couple || false,
      partnerName: row.partner_name,
      familySize: row.family_size || 1,
      hasChildren: row.has_children || false,
      
      // Location
      currentLocation: row.current_location,
      
      // Rental preferences
      preferredMoveIn: row.tenant_move_in_date || row.preferred_move_in,
      preferredLeaseMonths: row.tenant_lease_preference || row.preferred_lease_months || 12,
      interestMessage: row.tenant_interest_message || row.interest_message,
      
      // Rental history
      rentalHistory: row.rental_history,
    };
  }

  /**
   * Generate match highlights based on tenant and property data
   */
  private generateMatchHighlights(row: any): string[] {
    const highlights: string[] = [];
    const lifestyleTags = row.lifestyle_tags || [];

    // Work proximity highlight
    if (row.work_location_name && row.work_location_lat && row.property_lat) {
      const distance = this.calculateDistance(
        row.work_location_lat,
        row.work_location_lng,
        row.property_lat,
        row.property_lng
      );
      if (distance < 5) {
        highlights.push('Works nearby');
      } else if (distance < 10) {
        highlights.push(`${Math.round(distance)}km from work`);
      }
    }

    // Lifestyle-based highlights
    if (lifestyleTags.includes('pet_owner_dog') || lifestyleTags.includes('pet_owner_cat')) {
      highlights.push('Pet-friendly tenant');
    }
    if (lifestyleTags.includes('quiet_mornings')) {
      highlights.push('Early riser');
    }
    if (lifestyleTags.includes('wfh_heavy')) {
      highlights.push('Works from home');
    }
    if (lifestyleTags.includes('cook_frequently')) {
      highlights.push('Home cook');
    }
    if (lifestyleTags.includes('gym_nearby')) {
      highlights.push('Fitness enthusiast');
    }
    if (lifestyleTags.includes('non_smoker')) {
      highlights.push('Non-smoker');
    }

    // Budget fit highlight
    if (row.budget_min && row.budget_max && row.property_rent) {
      if (row.property_rent >= row.budget_min && row.property_rent <= row.budget_max) {
        highlights.push('Budget matches');
      }
    }

    // Occupation highlight
    if (row.occupation_type) {
      const occupationLabels: Record<string, string> = {
        'it_professional': 'IT Professional',
        'student': 'Student',
        'healthcare': 'Healthcare',
        'freelancer': 'Freelancer',
        'creative': 'Creative Professional',
        'corporate': 'Corporate Employee',
        'startup': 'Startup Employee',
      };
      if (occupationLabels[row.occupation_type]) {
        highlights.push(occupationLabels[row.occupation_type]);
      }
    }

    return highlights.slice(0, 5); // Max 5 highlights
  }

  /**
   * Generate human-readable match reason
   */
  private generateMatchReason(row: any, highlights: string[]): string {
    const score = row.match_score || 75;
    const topHighlights = highlights.slice(0, 2).join(', ');
    return `${score}% Match${topHighlights ? ` - ${topHighlights}` : ''}`;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Record landlord swipe on a tenant
   * 
   * @param landlordId - Landlord user ID
   * @param matchId - Match ID to swipe on
   * @param direction - 'right' (interested) or 'left' (not suitable)
   * @returns Swipe result with mutual match status
   */
  async recordSwipe(
    landlordId: string,
    matchId: string,
    direction: 'right' | 'left'
  ): Promise<SwipeResult> {
    // Verify the match belongs to landlord's property
    const matchResult = await query(
      `SELECT m.*, p.landlord_id, p.address, u.name as tenant_name, u.phone as tenant_phone
       FROM matches m
       JOIN properties p ON m.property_id = p.id
       JOIN users u ON m.tenant_id = u.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchResult.rowCount === 0) {
      return {
        success: false,
        isMutualMatch: false,
        matchId,
        message: 'Match not found',
      };
    }

    const match = matchResult.rows[0];

    if (match.landlord_id !== landlordId) {
      return {
        success: false,
        isMutualMatch: false,
        matchId,
        message: 'This match is not for your property',
      };
    }

    if (match.landlord_swiped) {
      return {
        success: false,
        isMutualMatch: match.status === 'active',
        matchId,
        message: 'You have already responded to this match',
      };
    }

    // Determine new status based on swipe direction
    const newStatus = direction === 'right' ? 'active' : 'declined';
    const isMutualMatch = direction === 'right' && match.tenant_swipe_direction === 'right';

    // Update the match
    await query(
      `UPDATE matches 
       SET landlord_swiped = true,
           landlord_swipe_direction = $1,
           landlord_swiped_at = CURRENT_TIMESTAMP,
           status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [direction, newStatus, matchId]
    );

    // TODO: Send notification to tenant if mutual match
    if (isMutualMatch) {
      console.log(`🎉 Mutual match! Landlord swiped right on ${match.tenant_name}'s interest in ${match.address}`);
      // In production: Send push notification to tenant
    }

    return {
      success: true,
      isMutualMatch,
      matchId,
      chatUnlocked: isMutualMatch,
      message: isMutualMatch 
        ? 'It\'s a match! You can now chat with this tenant.' 
        : direction === 'right' 
          ? 'Interest noted. Waiting for mutual match.'
          : 'Tenant declined.',
    };
  }

  /**
   * Get count of pending tenant swipes for landlord
   */
  async getPendingSwipeCount(landlordId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM matches m
       JOIN properties p ON m.property_id = p.id
       WHERE p.landlord_id = $1 
         AND m.tenant_swipe_direction = 'right'
         AND (m.landlord_swiped = false OR m.landlord_swiped IS NULL)
         AND p.status = 'available'`,
      [landlordId]
    );

    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Bulk decline all pending swipes for a property
   * (Useful when property is rented)
   */
  async declineAllPendingForProperty(propertyId: string): Promise<number> {
    const result = await query(
      `UPDATE matches 
       SET landlord_swiped = true,
           landlord_swipe_direction = 'left',
           landlord_swiped_at = CURRENT_TIMESTAMP,
           status = 'declined',
           updated_at = CURRENT_TIMESTAMP
       WHERE property_id = $1 
         AND tenant_swipe_direction = 'right'
         AND (landlord_swiped = false OR landlord_swiped IS NULL)
       RETURNING id`,
      [propertyId]
    );

    return result.rowCount || 0;
  }
}

export const landlordSwipeService = new LandlordSwipeService();
