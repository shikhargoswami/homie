/**
 * Lifestyle Matching Service
 * 
 * Extends base matching with lifestyle-specific scoring
 * Based on tech-1.md user journey requirements
 * 
 * Unique Data Points:
 * - Pet compatibility (owner needs pet-friendly property)
 * - Musician needs soundproofed building
 * - Sunlight preferences (hours per room)
 * - Noise sensitivity (dB readings by time of day)
 * - Roommate compatibility (sleep schedule, cleanliness, etc.)
 */

import { query } from '../database/client';
import {
  LifestyleTag,
  NoiseLevels,
  RoommatePreferences,
  MatchScore,
} from '@homie/shared';

interface TenantLifestyleProfile {
  userId: string;
  lifestyleTags: LifestyleTag[];
  roommatePreferences?: RoommatePreferences;
  maxCommuteMinutes: number;
  commuteMode: string;
  workLocationLat?: number;
  workLocationLng?: number;
}

interface PropertyLifestyleData {
  propertyId: string;
  noiseLevels: NoiseLevels;
  sunlightHours: Record<string, number>;
  petDetails: {
    dogsAllowed: boolean;
    catsAllowed: boolean;
    maxWeightKg?: number;
  };
  soundproofRating?: number;
  commuteMatrix: Record<string, number>;
}

// Lifestyle tag compatibility matrix
// Higher number = better match
const LIFESTYLE_COMPATIBILITY: Record<LifestyleTag, {
  propertyRequirement: string;
  scoringWeight: number;
}> = {
  pet_owner_dog: { propertyRequirement: 'pets_allowed', scoringWeight: 10 },
  pet_owner_cat: { propertyRequirement: 'cats_allowed', scoringWeight: 10 },
  musician_guitar: { propertyRequirement: 'soundproof_rating', scoringWeight: 8 },
  musician_drums: { propertyRequirement: 'soundproof_rating', scoringWeight: 10 },
  musician_keyboard: { propertyRequirement: 'soundproof_rating', scoringWeight: 6 },
  sunlight_lover: { propertyRequirement: 'sunlight_hours', scoringWeight: 7 },
  quiet_mornings: { propertyRequirement: 'noise_morning', scoringWeight: 8 },
  early_riser: { propertyRequirement: 'noise_morning', scoringWeight: 5 },
  night_owl: { propertyRequirement: 'noise_night', scoringWeight: 6 },
  gym_nearby: { propertyRequirement: 'gym_distance', scoringWeight: 5 },
  cook_frequently: { propertyRequirement: 'kitchen_type', scoringWeight: 6 },
  nightlife: { propertyRequirement: 'nightlife_distance', scoringWeight: 4 },
  wfh_heavy: { propertyRequirement: 'internet_speed', scoringWeight: 8 },
  social_gatherings: { propertyRequirement: 'community_space', scoringWeight: 5 },
  yoga_meditation: { propertyRequirement: 'quiet_spaces', scoringWeight: 6 },
  outdoor_activities: { propertyRequirement: 'parks_nearby', scoringWeight: 5 },
};

// Noise level thresholds (dB)
const NOISE_THRESHOLDS = {
  QUIET: 40,      // Library-quiet
  MODERATE: 55,   // Normal conversation
  LOUD: 70,       // Street traffic
};

class LifestyleMatchingService {
  /**
   * Calculate lifestyle match score (0-25 points)
   * This adds to the existing base match score
   */
  async calculateLifestyleScore(
    tenantId: string,
    propertyId: string
  ): Promise<{
    score: number;
    breakdown: Record<string, number>;
    insights: string[];
  }> {
    // Get tenant lifestyle profile
    const tenantProfile = await this.getTenantLifestyleProfile(tenantId);
    
    if (!tenantProfile || tenantProfile.lifestyleTags.length === 0) {
      return {
        score: 12.5, // Neutral score (half of max)
        breakdown: {},
        insights: ['Complete your lifestyle profile for better matches'],
      };
    }

    // Get property lifestyle data
    const propertyData = await this.getPropertyLifestyleData(propertyId);
    
    let totalScore = 0;
    const breakdown: Record<string, number> = {};
    const insights: string[] = [];
    const maxPossibleScore = 25;

    // Score each lifestyle tag
    for (const tag of tenantProfile.lifestyleTags) {
      const compatibility = LIFESTYLE_COMPATIBILITY[tag];
      if (!compatibility) continue;

      const tagScore = await this.scoreLifestyleTag(
        tag,
        tenantProfile,
        propertyData
      );
      
      breakdown[tag] = tagScore.score;
      totalScore += tagScore.score;
      
      if (tagScore.insight) {
        insights.push(tagScore.insight);
      }
    }

    // Normalize score to 0-25 range
    const tagCount = tenantProfile.lifestyleTags.length;
    const normalizedScore = tagCount > 0
      ? Math.min((totalScore / tagCount) * (maxPossibleScore / 10), maxPossibleScore)
      : maxPossibleScore / 2;

    return {
      score: Math.round(normalizedScore * 10) / 10,
      breakdown,
      insights: insights.slice(0, 3), // Top 3 insights
    };
  }

  /**
   * Score individual lifestyle tag
   */
  private async scoreLifestyleTag(
    tag: LifestyleTag,
    tenant: TenantLifestyleProfile,
    property: PropertyLifestyleData | null
  ): Promise<{ score: number; insight?: string }> {
    if (!property) {
      return { score: 5, insight: undefined }; // Neutral when no data
    }

    switch (tag) {
      // Pet owners need pet-friendly properties
      case 'pet_owner_dog':
        if (property.petDetails?.dogsAllowed) {
          return { score: 10, insight: '🐕 Dogs allowed in this property' };
        }
        return { score: 0, insight: '❌ Dogs not allowed' };

      case 'pet_owner_cat':
        if (property.petDetails?.catsAllowed) {
          return { score: 10, insight: '🐱 Cats welcome' };
        }
        return { score: 0, insight: '❌ Cats not allowed' };

      // Musicians need soundproofing
      case 'musician_guitar':
      case 'musician_keyboard':
      case 'musician_drums':
        const requiredRating = tag === 'musician_drums' ? 4 : 3;
        if (property.soundproofRating && property.soundproofRating >= requiredRating) {
          return { 
            score: 10, 
            insight: `🎸 Good soundproofing (${property.soundproofRating}/5)` 
          };
        }
        return { 
          score: property.soundproofRating ? property.soundproofRating * 2 : 3,
          insight: property.soundproofRating 
            ? `⚠️ Limited soundproofing (${property.soundproofRating}/5)`
            : 'Soundproofing info not available'
        };

      // Sunlight lovers need bright rooms
      case 'sunlight_lover':
        if (property.sunlightHours) {
          const avgSunlight = Object.values(property.sunlightHours).reduce(
            (a, b) => a + b, 0
          ) / Object.keys(property.sunlightHours).length;
          
          if (avgSunlight >= 6) {
            return { score: 10, insight: `☀️ Excellent sunlight (${Math.round(avgSunlight)}h avg)` };
          } else if (avgSunlight >= 4) {
            return { score: 7, insight: `🌤️ Good sunlight (${Math.round(avgSunlight)}h avg)` };
          }
          return { score: 4, insight: `🌥️ Limited sunlight (${Math.round(avgSunlight)}h avg)` };
        }
        return { score: 5 };

      // Quiet morning preference
      case 'quiet_mornings':
        if (property.noiseLevels?.morning !== null) {
          const morningDb = property.noiseLevels.morning;
          if (morningDb <= NOISE_THRESHOLDS.QUIET) {
            return { score: 10, insight: `🤫 Very quiet mornings (${morningDb}dB)` };
          } else if (morningDb <= NOISE_THRESHOLDS.MODERATE) {
            return { score: 7, insight: `🔈 Moderate morning noise (${morningDb}dB)` };
          }
          return { score: 3, insight: `🔊 Noisy mornings (${morningDb}dB)` };
        }
        return { score: 5 };

      // Night owl - check night noise levels
      case 'night_owl':
        if (property.noiseLevels?.night !== null) {
          const nightDb = property.noiseLevels.night;
          // Night owls might prefer livelier areas
          if (nightDb >= NOISE_THRESHOLDS.QUIET && nightDb <= NOISE_THRESHOLDS.MODERATE) {
            return { score: 10, insight: `🌙 Good nightlife area` };
          }
          return { score: 7 };
        }
        return { score: 5 };

      // WFH needs good internet
      case 'wfh_heavy':
        // Check if property has wifi included and good features
        return { score: 7, insight: 'Check internet speed during viewing' };

      default:
        return { score: 5 };
    }
  }

  /**
   * Get tenant's lifestyle profile
   */
  private async getTenantLifestyleProfile(
    tenantId: string
  ): Promise<TenantLifestyleProfile | null> {
    const result = await query(
      `SELECT 
        user_id,
        lifestyle_tags,
        roommate_preferences,
        max_commute_minutes,
        commute_mode,
        work_location_lat,
        work_location_lng
       FROM tenant_profiles
       WHERE user_id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      lifestyleTags: row.lifestyle_tags || [],
      roommatePreferences: row.roommate_preferences,
      maxCommuteMinutes: row.max_commute_minutes || 30,
      commuteMode: row.commute_mode || 'any',
      workLocationLat: row.work_location_lat,
      workLocationLng: row.work_location_lng,
    };
  }

  /**
   * Get property's lifestyle data
   */
  private async getPropertyLifestyleData(
    propertyId: string
  ): Promise<PropertyLifestyleData | null> {
    const result = await query(
      `SELECT 
        id,
        noise_levels,
        sunlight_hours,
        pet_details,
        soundproof_rating,
        commute_matrix
       FROM properties
       WHERE id = $1`,
      [propertyId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      propertyId: row.id,
      noiseLevels: row.noise_levels || { morning: null, evening: null, night: null },
      sunlightHours: row.sunlight_hours || {},
      petDetails: row.pet_details || { dogsAllowed: false, catsAllowed: false },
      soundproofRating: row.soundproof_rating,
      commuteMatrix: row.commute_matrix || {},
    };
  }

  /**
   * Calculate roommate compatibility score (for flatmate search)
   */
  async calculateRoommateCompatibility(
    tenantId: string,
    existingFlatmatesProfiles: any[]
  ): Promise<{
    score: number;
    compatibilityFactors: string[];
    warnings: string[];
  }> {
    const tenantProfile = await this.getTenantLifestyleProfile(tenantId);
    
    if (!tenantProfile?.roommatePreferences || existingFlatmatesProfiles.length === 0) {
      return {
        score: 50,
        compatibilityFactors: [],
        warnings: ['Limited compatibility data available'],
      };
    }

    const tenant = tenantProfile.roommatePreferences;
    const compatibilityFactors: string[] = [];
    const warnings: string[] = [];
    let totalScore = 0;
    let factorCount = 0;

    // Compare with each existing flatmate
    for (const flatmate of existingFlatmatesProfiles) {
      // Sleep schedule compatibility
      if (tenant.sleepSchedule && flatmate.sleepSchedule) {
        factorCount++;
        if (tenant.sleepSchedule === flatmate.sleepSchedule) {
          totalScore += 20;
          compatibilityFactors.push('Similar sleep schedules');
        } else if (tenant.sleepSchedule === 'flexible' || flatmate.sleepSchedule === 'flexible') {
          totalScore += 15;
        } else {
          totalScore += 5;
          warnings.push('Different sleep schedules may cause friction');
        }
      }

      // Cleanliness level
      if (tenant.cleanlinessLevel && flatmate.cleanlinessLevel) {
        factorCount++;
        if (tenant.cleanlinessLevel === flatmate.cleanlinessLevel) {
          totalScore += 20;
          compatibilityFactors.push('Same cleanliness standards');
        } else {
          const levels = ['relaxed', 'moderate', 'strict'];
          const diff = Math.abs(
            levels.indexOf(tenant.cleanlinessLevel) - 
            levels.indexOf(flatmate.cleanlinessLevel)
          );
          totalScore += diff === 1 ? 12 : 5;
          if (diff > 1) warnings.push('Very different cleanliness expectations');
        }
      }

      // Social preference
      if (tenant.socialPreference && flatmate.socialPreference) {
        factorCount++;
        if (tenant.socialPreference === flatmate.socialPreference) {
          totalScore += 20;
          compatibilityFactors.push('Compatible social preferences');
        } else {
          totalScore += 10;
        }
      }

      // Smoking
      if (tenant.smoking !== undefined && flatmate.smoking !== undefined) {
        factorCount++;
        if (tenant.smoking === flatmate.smoking) {
          totalScore += 20;
        } else if (tenant.smoking === 'not_allowed' && flatmate.smoking !== 'not_allowed') {
          totalScore += 0;
          warnings.push('Smoking policy mismatch');
        } else {
          totalScore += 10;
        }
      }

      // Food preference
      if (tenant.foodPreference && flatmate.foodPreference) {
        factorCount++;
        if (tenant.foodPreference === 'veg_only' && flatmate.foodPreference !== 'veg_only') {
          totalScore += 5;
          warnings.push('Vegetarian preference may not align');
        } else {
          totalScore += 15;
        }
      }
    }

    const avgScore = factorCount > 0 ? totalScore / factorCount : 50;
    const normalizedScore = Math.min(Math.round(avgScore / 20 * 100), 100);

    return {
      score: normalizedScore,
      compatibilityFactors: [...new Set(compatibilityFactors)],
      warnings: [...new Set(warnings)],
    };
  }

  /**
   * Get lifestyle-based property recommendations
   */
  async getLifestyleRecommendations(
    tenantId: string,
    baseRecommendations: Array<{ propertyId: string; matchScore: number }>
  ): Promise<Array<{
    propertyId: string;
    matchScore: number;
    lifestyleScore: number;
    combinedScore: number;
    insights: string[];
  }>> {
    const enhanced = await Promise.all(
      baseRecommendations.map(async (rec) => {
        const lifestyleResult = await this.calculateLifestyleScore(
          tenantId,
          rec.propertyId
        );

        // Combined score: 75% base + 25% lifestyle
        const combinedScore = Math.round(
          rec.matchScore * 0.75 + lifestyleResult.score * 3 // lifestyle is 0-25, multiply by 3 to normalize
        );

        return {
          propertyId: rec.propertyId,
          matchScore: rec.matchScore,
          lifestyleScore: lifestyleResult.score,
          combinedScore: Math.min(combinedScore, 100),
          insights: lifestyleResult.insights,
        };
      })
    );

    // Re-rank by combined score
    return enhanced.sort((a, b) => b.combinedScore - a.combinedScore);
  }
}

export const lifestyleMatchingService = new LifestyleMatchingService();
export default lifestyleMatchingService;
