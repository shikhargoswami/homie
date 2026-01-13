import { apiClient } from './api';

/**
 * Matching Service
 * 
 * Handles:
 * - Property recommendations
 * - Swipe actions
 * - Match statistics
 * - Mutual matches
 */

export interface Property {
  id: string;
  landlord_id: string;
  landlord_name: string;
  landlord_rating: number;
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  property_type: string;
  configuration: string;
  size_sqft: number;
  floor_number: number;
  total_floors: number;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
  rent: number;
  security_deposit: number;
  maintenance_charge: number;
  min_lease_duration?: number;
  amenities: string[];
  photos: string[];
  vr_tour_url?: string;
  available_from: string;
  matchScore?: number;
  matchReason?: string;
  commuteTime?: number;
}

export interface RecommendationsResponse {
  success: boolean;
  data: {
    properties: Property[];
    remaining: number;
  };
}

export interface SwipeResponse {
  success: boolean;
  data: {
    message: string;
    isMutualMatch: boolean;
    remaining: number;
  };
}

export interface MatchStats {
  rightSwipes: number;
  leftSwipes: number;
  superLikes: number;
  mutualMatches: number;
  todayRemaining: number;
}

export interface StatsResponse {
  success: boolean;
  data: {
    stats: MatchStats;
  };
}

class MatchingService {
  /**
   * Get property recommendations
   */
  async getRecommendations(limit: number = 20): Promise<Property[]> {
    const response = await apiClient.get<RecommendationsResponse>(
      '/api/matches/recommendations',
      { limit }
    );
    
    // DEBUG: Log first property to check photos
    if (response.data.properties.length > 0) {
      const firstProperty = response.data.properties[0];
      console.log('🔍 First property from API:', {
        id: firstProperty.id,
        config: firstProperty.configuration,
        photosType: typeof firstProperty.photos,
        photosIsArray: Array.isArray(firstProperty.photos),
        photosLength: firstProperty.photos?.length,
        photos: firstProperty.photos,
      });
    }
    
    return response.data.properties;
  }

  /**
   * Record swipe action
   */
  async swipe(
    propertyId: string,
    direction: 'right' | 'left' | 'super'
  ): Promise<SwipeResponse> {
    return apiClient.post<SwipeResponse>('/api/matches/swipe', {
      propertyId,
      direction,
    });
  }

  /**
   * Get match statistics
   */
  async getStats(): Promise<MatchStats> {
    const response = await apiClient.get<StatsResponse>('/api/matches/stats');
    return response.data.stats;
  }

  /**
   * Get mutual matches
   */
  async getMutualMatches(): Promise<any[]> {
    const response = await apiClient.get<{ success: boolean; data: { matches: any[] } }>(
      '/api/matches/mutual'
    );
    return response.data.matches;
  }
}

// Singleton instance
export const matchingService = new MatchingService();
