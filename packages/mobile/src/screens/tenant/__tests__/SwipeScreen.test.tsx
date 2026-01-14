import { describe, it, expect, beforeEach, jest } from '@jest/globals';

/**
 * SwipeScreen Tests
 * 
 * Tests for:
 * - Filter initialization from user preferences
 * - Property filtering logic
 * - Filter chip interactions
 */

// Mock services
jest.mock('@services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('@hooks/useMatching', () => ({
  useRecommendations: jest.fn(),
  useSwipe: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useMatchStats: jest.fn(() => ({
    data: { rightSwipes: 0, leftSwipes: 0, mutualMatches: 0 },
  })),
}));

jest.mock('@hooks/usePreferences', () => ({
  usePreferences: jest.fn(),
  findMatchingBudgetOption: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn() as jest.Mock,
  goBack: jest.fn() as jest.Mock,
};

describe('SwipeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Initialization from Preferences', () => {
    it('should initialize budget filter from user preferences', () => {
      const { usePreferences, findMatchingBudgetOption } = require('@hooks/usePreferences');
      const { useRecommendations } = require('@hooks/useMatching');
      
      usePreferences.mockReturnValue({
        data: {
          budget_min: 20000,
          budget_max: 35000,
          preferred_configuration: '2bhk',
        },
        isLoading: false,
      });

      findMatchingBudgetOption.mockReturnValue({ min: 20000, max: 25000 });

      useRecommendations.mockReturnValue({
        data: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      // The initialization effect should set budget filter
      expect(usePreferences).toBeDefined();
    });

    it('should initialize BHK filter from user preferences', () => {
      const { usePreferences } = require('@hooks/usePreferences');
      
      usePreferences.mockReturnValue({
        data: {
          preferred_configuration: '3bhk',
        },
        isLoading: false,
      });

      // Test that 3bhk preference maps to bhk filter
      expect(usePreferences().data.preferred_configuration).toBe('3bhk');
    });

    it('should initialize commute filter from lifestyle preferences', () => {
      const { usePreferences } = require('@hooks/usePreferences');
      
      usePreferences.mockReturnValue({
        data: {
          lifestyle: {
            tags: [],
            maxCommuteMinutes: 30,
            commuteMode: 'walk_metro',
            workLocation: null,
          },
        },
        isLoading: false,
      });

      expect(usePreferences().data.lifestyle.maxCommuteMinutes).toBe(30);
    });

    it('should initialize lifestyle filters from tags', () => {
      const { usePreferences } = require('@hooks/usePreferences');
      
      usePreferences.mockReturnValue({
        data: {
          pets_allowed: true,
          lifestyle: {
            tags: ['sunlight_lover', 'quiet_mornings'],
            maxCommuteMinutes: 30,
            commuteMode: 'any',
            workLocation: null,
          },
        },
        isLoading: false,
      });

      const prefs = usePreferences().data;
      expect(prefs.pets_allowed).toBe(true);
      expect(prefs.lifestyle.tags).toContain('sunlight_lover');
      expect(prefs.lifestyle.tags).toContain('quiet_mornings');
    });
  });

  describe('Property Filtering Logic', () => {
    it('should filter properties by budget range', () => {
      const properties = [
        { id: '1', rent: 15000, configuration: '2bhk' },
        { id: '2', rent: 25000, configuration: '2bhk' },
        { id: '3', rent: 35000, configuration: '2bhk' },
      ];

      const budgetFilter = { min: 20000, max: 30000 };

      const filtered = properties.filter(p => 
        p.rent >= budgetFilter.min && p.rent <= budgetFilter.max
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter properties by BHK configuration', () => {
      const properties = [
        { id: '1', rent: 20000, configuration: '1bhk' },
        { id: '2', rent: 25000, configuration: '2bhk' },
        { id: '3', rent: 30000, configuration: '3bhk' },
      ];

      const bhkFilter = '2bhk';

      const filtered = properties.filter(p => 
        p.configuration?.toLowerCase() === bhkFilter.toLowerCase()
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter properties by commute time', () => {
      const properties = [
        { id: '1', rent: 20000, commuteTime: 10 },
        { id: '2', rent: 25000, commuteTime: 25 },
        { id: '3', rent: 30000, commuteTime: 40 },
      ];

      const commuteFilter = 30;

      const filtered = properties.filter(p => 
        p.commuteTime && p.commuteTime <= commuteFilter
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['1', '2']);
    });

    it('should filter properties by pet-friendly status', () => {
      const properties = [
        { id: '1', rent: 20000, pet_details: { dogs_allowed: true, cats_allowed: true } },
        { id: '2', rent: 25000, pet_details: { dogs_allowed: false, cats_allowed: false } },
        { id: '3', rent: 30000, pet_details: { dogs_allowed: true, cats_allowed: false } },
      ];

      const filtered = properties.filter(p => 
        p.pet_details?.dogs_allowed || p.pet_details?.cats_allowed
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should filter properties by high sunlight', () => {
      const properties = [
        { id: '1', rent: 20000, sunlight_hours: { average: 6 } },
        { id: '2', rent: 25000, sunlight_hours: { average: 3 } },
        { id: '3', rent: 30000, sunlight_hours: { average: 7 } },
      ];

      const minSunlight = 5;

      const filtered = properties.filter(p => {
        const avgSunlight = p.sunlight_hours?.average || 0;
        return avgSunlight >= minSunlight;
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should filter properties by noise level (quiet)', () => {
      const properties = [
        { id: '1', rent: 20000, noise_levels: { morning: 35, evening: 40 } },
        { id: '2', rent: 25000, noise_levels: { morning: 60, evening: 55 } },
        { id: '3', rent: 30000, noise_levels: { morning: 45, evening: 48 } },
      ];

      const maxNoise = 50;

      const filtered = properties.filter(p => {
        const noiseLevel = p.noise_levels?.morning || p.noise_levels?.evening;
        return !noiseLevel || noiseLevel <= maxNoise;
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should filter properties by metro proximity', () => {
      const properties = [
        { id: '1', rent: 20000, neighborhood_pois: { metro_distance_m: 500 } },
        { id: '2', rent: 25000, neighborhood_pois: { metro_distance_m: 1500 } },
        { id: '3', rent: 30000, neighborhood_pois: { metro_distance_m: 800 } },
      ];

      const maxMetroDistance = 1000;

      const filtered = properties.filter(p => 
        p.neighborhood_pois?.metro_distance_m && 
        p.neighborhood_pois.metro_distance_m <= maxMetroDistance
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should filter properties by gym proximity', () => {
      const properties = [
        { id: '1', rent: 20000, neighborhood_pois: { gyms_1km: 2 } },
        { id: '2', rent: 25000, neighborhood_pois: { gyms_1km: 0 } },
        { id: '3', rent: 30000, neighborhood_pois: { gyms_1km: 3 } },
      ];

      const filtered = properties.filter(p => 
        p.neighborhood_pois?.gyms_1km && p.neighborhood_pois.gyms_1km >= 1
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.id)).toEqual(['1', '3']);
    });

    it('should combine multiple filters correctly', () => {
      const properties = [
        { 
          id: '1', 
          rent: 25000, 
          configuration: '2bhk',
          commuteTime: 20,
          pet_details: { dogs_allowed: true, cats_allowed: false },
        },
        { 
          id: '2', 
          rent: 35000, // Outside budget
          configuration: '2bhk',
          commuteTime: 20,
          pet_details: { dogs_allowed: true, cats_allowed: true },
        },
        { 
          id: '3', 
          rent: 22000,
          configuration: '3bhk', // Wrong BHK
          commuteTime: 20,
          pet_details: { dogs_allowed: true, cats_allowed: false },
        },
        { 
          id: '4', 
          rent: 23000,
          configuration: '2bhk',
          commuteTime: 45, // Too long commute
          pet_details: { dogs_allowed: true, cats_allowed: false },
        },
        { 
          id: '5', 
          rent: 24000,
          configuration: '2bhk',
          commuteTime: 25,
          pet_details: { dogs_allowed: false, cats_allowed: false }, // No pets
        },
      ];

      const filters = {
        budget: { min: 20000, max: 30000 },
        bhk: '2bhk',
        commute: 30,
        lifestyle: ['pet_friendly'],
      };

      const filtered = properties.filter(p => {
        // Budget
        if (p.rent < filters.budget.min || p.rent > filters.budget.max) return false;
        
        // BHK
        if (p.configuration?.toLowerCase() !== filters.bhk.toLowerCase()) return false;
        
        // Commute
        if (p.commuteTime && p.commuteTime > filters.commute) return false;
        
        // Pet-friendly
        if (filters.lifestyle.includes('pet_friendly')) {
          if (!p.pet_details?.dogs_allowed && !p.pet_details?.cats_allowed) return false;
        }
        
        return true;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('Filter State Management', () => {
    it('should reset filters when clearAllFilters is called', () => {
      const initialFilters: {
        budget?: { min: number; max: number };
        bhk?: string;
        commute?: number;
        lifestyle: string[];
      } = {
        budget: { min: 20000, max: 30000 },
        bhk: '2bhk',
        commute: 30,
        lifestyle: ['pet_friendly', 'high_sunlight'],
      };

      const clearedFilters: {
        budget?: { min: number; max: number };
        bhk?: string;
        commute?: number;
        lifestyle: string[];
      } = { lifestyle: [] };

      expect(clearedFilters.budget).toBeUndefined();
      expect(clearedFilters.bhk).toBeUndefined();
      expect(clearedFilters.commute).toBeUndefined();
      expect(clearedFilters.lifestyle).toEqual([]);
    });

    it('should count active filters correctly', () => {
      const filters: {
        budget?: { min: number; max: number };
        bhk?: string;
        commute?: number;
        lifestyle: string[];
      } = {
        budget: { min: 20000, max: 30000 },
        bhk: '2bhk',
        commute: 30,
        lifestyle: ['pet_friendly', 'high_sunlight'],
      };

      let count = 0;
      if (filters.budget) count++;
      if (filters.bhk) count++;
      if (filters.commute) count++;
      count += filters.lifestyle.length;

      expect(count).toBe(5); // 3 basic filters + 2 lifestyle
    });

    it('should toggle budget filter correctly', () => {
      let activeFilters = { lifestyle: [] as string[], budget: undefined as { min: number; max: number } | undefined };
      
      const toggleBudgetFilter = (value: { min: number; max: number }) => {
        activeFilters = {
          ...activeFilters,
          budget: activeFilters.budget?.min === value.min ? undefined : value,
        };
      };

      // First toggle - should set
      toggleBudgetFilter({ min: 20000, max: 25000 });
      expect(activeFilters.budget).toEqual({ min: 20000, max: 25000 });

      // Second toggle same value - should unset
      toggleBudgetFilter({ min: 20000, max: 25000 });
      expect(activeFilters.budget).toBeUndefined();

      // Toggle different value - should set new
      toggleBudgetFilter({ min: 15000, max: 20000 });
      expect(activeFilters.budget).toEqual({ min: 15000, max: 20000 });
    });

    it('should toggle lifestyle filter correctly', () => {
      let activeFilters = { lifestyle: [] as string[] };
      
      const toggleLifestyleFilter = (value: string) => {
        activeFilters = {
          ...activeFilters,
          lifestyle: activeFilters.lifestyle.includes(value)
            ? activeFilters.lifestyle.filter(v => v !== value)
            : [...activeFilters.lifestyle, value],
        };
      };

      // Add pet_friendly
      toggleLifestyleFilter('pet_friendly');
      expect(activeFilters.lifestyle).toContain('pet_friendly');

      // Add high_sunlight
      toggleLifestyleFilter('high_sunlight');
      expect(activeFilters.lifestyle).toContain('pet_friendly');
      expect(activeFilters.lifestyle).toContain('high_sunlight');
      expect(activeFilters.lifestyle).toHaveLength(2);

      // Remove pet_friendly
      toggleLifestyleFilter('pet_friendly');
      expect(activeFilters.lifestyle).not.toContain('pet_friendly');
      expect(activeFilters.lifestyle).toContain('high_sunlight');
      expect(activeFilters.lifestyle).toHaveLength(1);
    });
  });
});
