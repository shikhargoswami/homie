import { describe, it, expect } from '@jest/globals';
import { findMatchingBudgetOption, preferencesToFilters } from '../usePreferences';
import type { UserPreferences } from '../usePreferences';

/**
 * Unit tests for usePreferences hook utility functions
 */

describe('usePreferences utilities', () => {
  describe('findMatchingBudgetOption', () => {
    const budgetOptions = [
      { label: '₹10-15k', value: { min: 10000, max: 15000 } },
      { label: '₹15-20k', value: { min: 15000, max: 20000 } },
      { label: '₹20-25k', value: { min: 20000, max: 25000 } },
      { label: '₹25-35k', value: { min: 25000, max: 35000 } },
      { label: '₹35k+', value: { min: 35000, max: 100000 } },
    ];

    it('should return exact match when budget matches option exactly', () => {
      const result = findMatchingBudgetOption(15000, 20000, budgetOptions);
      expect(result).toEqual({ min: 15000, max: 20000 });
    });

    it('should return containing option when budget is within range', () => {
      const result = findMatchingBudgetOption(16000, 19000, budgetOptions);
      expect(result).toEqual({ min: 15000, max: 20000 });
    });

    it('should return overlapping option when budget overlaps', () => {
      const result = findMatchingBudgetOption(18000, 22000, budgetOptions);
      // Should find ₹15-20k or ₹20-25k based on overlap
      expect(result).toBeDefined();
      expect(result!.min).toBeLessThanOrEqual(22000);
      expect(result!.max).toBeGreaterThanOrEqual(18000);
    });

    it('should return undefined when no match found', () => {
      const result = findMatchingBudgetOption(1000, 5000, budgetOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined when budget is undefined', () => {
      const result = findMatchingBudgetOption(undefined, undefined, budgetOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined when only min is provided', () => {
      const result = findMatchingBudgetOption(15000, undefined, budgetOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined when only max is provided', () => {
      const result = findMatchingBudgetOption(undefined, 20000, budgetOptions);
      expect(result).toBeUndefined();
    });
  });

  describe('preferencesToFilters', () => {
    it('should return empty filters for undefined preferences', () => {
      const result = preferencesToFilters(undefined);
      expect(result).toEqual({ lifestyle: [] });
    });

    it('should map budget preferences to filter format', () => {
      const preferences: UserPreferences = {
        budget_min: 15000,
        budget_max: 25000,
      };
      const result = preferencesToFilters(preferences);
      expect(result.budget).toEqual({ min: 15000, max: 25000 });
    });

    it('should map BHK configuration to filter format', () => {
      const preferences: UserPreferences = {
        preferred_configuration: '2bhk',
      };
      const result = preferencesToFilters(preferences);
      expect(result.bhk).toBe('2bhk');
    });

    it('should map commute time from lifestyle preferences', () => {
      const preferences: UserPreferences = {
        lifestyle: {
          tags: [],
          maxCommuteMinutes: 30,
          commuteMode: 'any',
          workLocation: null,
        },
      };
      const result = preferencesToFilters(preferences);
      expect(result.commute).toBe(30);
    });

    it('should map pets_allowed to pet_friendly lifestyle filter', () => {
      const preferences: UserPreferences = {
        pets_allowed: true,
      };
      const result = preferencesToFilters(preferences);
      expect(result.lifestyle).toContain('pet_friendly');
    });

    it('should map sunlight_lover tag to high_sunlight filter', () => {
      const preferences: UserPreferences = {
        lifestyle: {
          tags: ['sunlight_lover'],
          maxCommuteMinutes: 30,
          commuteMode: 'any',
          workLocation: null,
        },
      };
      const result = preferencesToFilters(preferences);
      expect(result.lifestyle).toContain('high_sunlight');
    });

    it('should map quiet_mornings tag to quiet filter', () => {
      const preferences: UserPreferences = {
        lifestyle: {
          tags: ['quiet_mornings'],
          maxCommuteMinutes: 30,
          commuteMode: 'any',
          workLocation: null,
        },
      };
      const result = preferencesToFilters(preferences);
      expect(result.lifestyle).toContain('quiet');
    });

    it('should map gym_nearby tag to gym_nearby filter', () => {
      const preferences: UserPreferences = {
        lifestyle: {
          tags: ['gym_nearby'],
          maxCommuteMinutes: 30,
          commuteMode: 'any',
          workLocation: null,
        },
      };
      const result = preferencesToFilters(preferences);
      expect(result.lifestyle).toContain('gym_nearby');
    });

    it('should combine multiple lifestyle filters', () => {
      const preferences: UserPreferences = {
        pets_allowed: true,
        lifestyle: {
          tags: ['sunlight_lover', 'quiet_mornings', 'gym_nearby'],
          maxCommuteMinutes: 45,
          commuteMode: 'walk_metro',
          workLocation: null,
        },
      };
      const result = preferencesToFilters(preferences);
      expect(result.lifestyle).toContain('pet_friendly');
      expect(result.lifestyle).toContain('high_sunlight');
      expect(result.lifestyle).toContain('quiet');
      expect(result.lifestyle).toContain('gym_nearby');
      expect(result.lifestyle).toHaveLength(4);
    });

    it('should not duplicate lifestyle filters', () => {
      const preferences: UserPreferences = {
        pets_allowed: true,
        lifestyle: {
          tags: ['sunlight_lover', 'sunlight_lover'], // Duplicate
          maxCommuteMinutes: 30,
          commuteMode: 'any',
          workLocation: null,
        },
      };
      const result = preferencesToFilters(preferences);
      const highSunlightCount = result.lifestyle.filter(l => l === 'high_sunlight').length;
      expect(highSunlightCount).toBe(1);
    });

    it('should handle empty preferences object', () => {
      const preferences: UserPreferences = {};
      const result = preferencesToFilters(preferences);
      expect(result).toEqual({ lifestyle: [] });
    });

    it('should handle all preferences together', () => {
      const preferences: UserPreferences = {
        budget_min: 20000,
        budget_max: 35000,
        preferred_configuration: '3bhk',
        pets_allowed: true,
        lifestyle: {
          tags: ['sunlight_lover'],
          maxCommuteMinutes: 30,
          commuteMode: 'car',
          workLocation: { lat: 12.9, lng: 77.6 },
        },
      };
      const result = preferencesToFilters(preferences);
      
      expect(result.budget).toEqual({ min: 20000, max: 35000 });
      expect(result.bhk).toBe('3bhk');
      expect(result.commute).toBe(30);
      expect(result.lifestyle).toContain('pet_friendly');
      expect(result.lifestyle).toContain('high_sunlight');
    });
  });
});
