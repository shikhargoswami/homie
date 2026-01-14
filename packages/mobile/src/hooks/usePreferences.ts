import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api';

/**
 * User Preferences Hook
 * 
 * Provides:
 * - Fetch user search preferences
 * - Update preferences
 * - Cache management
 * 
 * Used by SwipeScreen to initialize filters based on saved preferences
 */

export interface UserPreferences {
  search_type?: 'full_home' | 'room_sharing';
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  preferred_configuration?: string;
  preferred_furnishing?: string;
  preferred_amenities?: string[];
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  min_lease_duration?: number;
  move_in_date?: string;
  // Lifestyle preferences (tech-1.md)
  lifestyle?: {
    tags: string[];
    maxCommuteMinutes: number;
    commuteMode: 'walk_metro' | 'car' | 'bike' | 'bus' | 'wfh' | 'any';
    workLocation: { lat: number; lng: number } | null;
  };
  roommatePreferences?: any;
  occupationType?: string;
  gender?: string;
}

export interface PreferencesResponse {
  success: boolean;
  data: {
    preferences: UserPreferences;
  };
}

/**
 * Fetch user preferences
 * 
 * Caches for 5 minutes - invalidated when preferences are updated
 */
export const usePreferences = () => {
  return useQuery<UserPreferences>({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const response = await apiClient.get<PreferencesResponse>('/api/users/preferences');
      return response.data.preferences;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Update user preferences
 * 
 * Invalidates preferences cache and recommendations after update
 */
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await apiClient.put<{ success: boolean; message: string }>(
        '/api/users/preferences',
        preferences
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate preferences cache
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      // Invalidate recommendations since they depend on preferences
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

/**
 * Transform user preferences to SwipeScreen filter format
 * 
 * Maps saved preferences to the activeFilters state structure used in SwipeScreen
 */
export const preferencesToFilters = (preferences: UserPreferences | undefined) => {
  if (!preferences) {
    return { lifestyle: [] as string[] };
  }

  const filters: {
    budget?: { min: number; max: number };
    bhk?: string;
    commute?: number;
    lifestyle: string[];
  } = { lifestyle: [] };

  // Map budget range
  if (preferences.budget_min && preferences.budget_max) {
    filters.budget = {
      min: preferences.budget_min,
      max: preferences.budget_max,
    };
  }

  // Map BHK configuration
  if (preferences.preferred_configuration) {
    filters.bhk = preferences.preferred_configuration.toLowerCase();
  }

  // Map commute time
  if (preferences.lifestyle?.maxCommuteMinutes) {
    filters.commute = preferences.lifestyle.maxCommuteMinutes;
  }

  // Map lifestyle preferences to filter values
  const lifestyleFilters: string[] = [];
  
  // Map pets_allowed to pet_friendly filter
  if (preferences.pets_allowed) {
    lifestyleFilters.push('pet_friendly');
  }

  // Map lifestyle tags to filter values
  if (preferences.lifestyle?.tags) {
    const tagMappings: Record<string, string> = {
      'sunlight_lover': 'high_sunlight',
      'quiet_mornings': 'quiet',
      'gym_nearby': 'gym_nearby',
    };

    for (const tag of preferences.lifestyle.tags) {
      if (tagMappings[tag]) {
        lifestyleFilters.push(tagMappings[tag]);
      }
    }
  }

  filters.lifestyle = lifestyleFilters;

  return filters;
};

/**
 * Find matching budget filter option from preferences
 * 
 * Returns the closest matching predefined budget filter chip
 */
export const findMatchingBudgetOption = (
  budgetMin: number | undefined,
  budgetMax: number | undefined,
  options: Array<{ label: string; value: { min: number; max: number } }>
) => {
  if (!budgetMin || !budgetMax) return undefined;

  // Find exact match first
  const exactMatch = options.find(
    opt => opt.value.min === budgetMin && opt.value.max === budgetMax
  );
  if (exactMatch) return exactMatch.value;

  // Find option that contains the user's budget range
  const containingMatch = options.find(
    opt => budgetMin >= opt.value.min && budgetMax <= opt.value.max
  );
  if (containingMatch) return containingMatch.value;

  // Find option with overlapping range
  const overlappingMatch = options.find(
    opt => 
      (budgetMin >= opt.value.min && budgetMin <= opt.value.max) ||
      (budgetMax >= opt.value.min && budgetMax <= opt.value.max)
  );
  if (overlappingMatch) return overlappingMatch.value;

  return undefined;
};
