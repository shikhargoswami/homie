/**
 * Tests for Lifestyle Matching Service
 * 
 * Tests lifestyle-based scoring enhancements
 * based on tech-1.md user journey requirements
 */

import { describe, it, expect, afterEach, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { lifestyleMatchingService } from '../lifestyle.matching.service';
import { LifestyleTag } from '@homie/shared';

// Mock the database
jest.mock('../../database/client', () => ({
  query: jest.fn(),
}));

const { query } = require('../../database/client');
const mockQuery = query as Mock<any>;

describe('LifestyleMatchingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateLifestyleScore', () => {
    it('should return neutral score when no lifestyle tags', async () => {
      // Mock tenant with no lifestyle tags
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'tenant-1',
          lifestyle_tags: [],
          roommate_preferences: null,
          max_commute_minutes: 30,
          commute_mode: 'any',
        }],
      });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-1',
        'property-1'
      );

      expect(result.score).toBe(12.5); // Half of max (25)
      expect(result.insights).toContain('Complete your lifestyle profile for better matches');
    });

    it('should give high score for pet owner with pet-friendly property', async () => {
      // Mock tenant with pet owner tag
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-pet',
            lifestyle_tags: ['pet_owner_dog'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        // Mock property with pet details
        .mockResolvedValueOnce({
          rows: [{
            id: 'property-pet',
            noise_levels: { morning: 40, evening: 50, night: 35 },
            sunlight_hours: { living: 6, bedroom: 5 },
            pet_details: { dogsAllowed: true, catsAllowed: true, maxWeightKg: 30 },
            soundproof_rating: 3,
            commute_matrix: {},
          }],
        });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-pet',
        'property-pet'
      );

      expect(result.score).toBeGreaterThan(20); // High score
      expect(result.insights).toContain('🐕 Dogs allowed in this property');
    });

    it('should give low score for pet owner with no-pets property', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-pet2',
            lifestyle_tags: ['pet_owner_dog'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'property-nopet',
            noise_levels: null,
            sunlight_hours: null,
            pet_details: { dogsAllowed: false, catsAllowed: false },
            soundproof_rating: null,
            commute_matrix: {},
          }],
        });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-pet2',
        'property-nopet'
      );

      expect(result.score).toBeLessThan(10);
      expect(result.insights).toContain('❌ Dogs not allowed');
    });

    it('should score musician based on soundproofing', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-musician',
            lifestyle_tags: ['musician_guitar'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'property-soundproof',
            noise_levels: null,
            sunlight_hours: null,
            pet_details: null,
            soundproof_rating: 4,
            commute_matrix: {},
          }],
        });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-musician',
        'property-soundproof'
      );

      expect(result.score).toBeGreaterThan(15);
      expect(result.insights.some(i => i.includes('soundproofing'))).toBe(true);
    });

    it('should score sunlight lover based on sunlight hours', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-sun',
            lifestyle_tags: ['sunlight_lover'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'property-sunny',
            noise_levels: null,
            sunlight_hours: { living: 8, bedroom1: 6, bedroom2: 7 },
            pet_details: null,
            soundproof_rating: null,
            commute_matrix: {},
          }],
        });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-sun',
        'property-sunny'
      );

      expect(result.score).toBeGreaterThan(15);
      expect(result.insights.some(i => i.includes('sunlight'))).toBe(true);
    });

    it('should score quiet morning preference based on noise levels', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-quiet',
            lifestyle_tags: ['quiet_mornings'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'property-quiet',
            noise_levels: { morning: 35, evening: 45, night: 30 },
            sunlight_hours: null,
            pet_details: null,
            soundproof_rating: null,
            commute_matrix: {},
          }],
        });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-quiet',
        'property-quiet'
      );

      expect(result.score).toBeGreaterThan(15);
      expect(result.insights.some(i => i.includes('quiet mornings'))).toBe(true);
    });

    it('should handle multiple lifestyle tags', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-multi',
            lifestyle_tags: ['pet_owner_dog', 'sunlight_lover', 'quiet_mornings'] as LifestyleTag[],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'property-ideal',
            noise_levels: { morning: 35, evening: 45, night: 30 },
            sunlight_hours: { living: 7, bedroom: 6 },
            pet_details: { dogsAllowed: true, catsAllowed: true },
            soundproof_rating: 3,
            commute_matrix: {},
          }],
        });

      const result = await lifestyleMatchingService.calculateLifestyleScore(
        'tenant-multi',
        'property-ideal'
      );

      expect(result.score).toBeGreaterThan(20); // High score for matching multiple tags
      expect(result.breakdown).toHaveProperty('pet_owner_dog');
      expect(result.breakdown).toHaveProperty('sunlight_lover');
      expect(result.breakdown).toHaveProperty('quiet_mornings');
    });
  });

  describe('calculateRoommateCompatibility', () => {
    it('should calculate high compatibility for similar preferences', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'tenant-roomie',
          lifestyle_tags: [],
          roommate_preferences: {
            sleepSchedule: 'early_bird',
            cleanlinessLevel: 'moderate',
            socialPreference: 'social',
            smoking: 'not_allowed',
            foodPreference: 'no_preference',
          },
          max_commute_minutes: 30,
          commute_mode: 'any',
        }],
      });

      const existingFlatmates = [{
        sleepSchedule: 'early_bird',
        cleanlinessLevel: 'moderate',
        socialPreference: 'social',
        smoking: 'not_allowed',
        foodPreference: 'non_veg_ok',
      }];

      const result = await lifestyleMatchingService.calculateRoommateCompatibility(
        'tenant-roomie',
        existingFlatmates
      );

      expect(result.score).toBeGreaterThan(70);
      expect(result.compatibilityFactors).toContain('Similar sleep schedules');
      expect(result.compatibilityFactors).toContain('Same cleanliness standards');
    });

    it('should warn about incompatible preferences', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'tenant-night',
          lifestyle_tags: [],
          roommate_preferences: {
            sleepSchedule: 'night_owl',
            cleanlinessLevel: 'strict',
            smoking: 'not_allowed',
            foodPreference: 'veg_only',
          },
          max_commute_minutes: 30,
          commute_mode: 'any',
        }],
      });

      const existingFlatmates = [{
        sleepSchedule: 'early_bird',
        cleanlinessLevel: 'relaxed',
        smoking: 'allowed',
        foodPreference: 'non_veg_ok',
      }];

      const result = await lifestyleMatchingService.calculateRoommateCompatibility(
        'tenant-night',
        existingFlatmates
      );

      expect(result.score).toBeLessThan(50);
      expect(result.warnings).toContain('Different sleep schedules may cause friction');
      expect(result.warnings).toContain('Very different cleanliness expectations');
    });
  });

  describe('getLifestyleRecommendations', () => {
    it('should re-rank properties by combined score', async () => {
      // First property
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-rank',
            lifestyle_tags: ['pet_owner_dog'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'prop-1',
            pet_details: { dogsAllowed: false },
            noise_levels: null,
            sunlight_hours: null,
            soundproof_rating: null,
            commute_matrix: {},
          }],
        })
        // Second property
        .mockResolvedValueOnce({
          rows: [{
            user_id: 'tenant-rank',
            lifestyle_tags: ['pet_owner_dog'],
            roommate_preferences: null,
            max_commute_minutes: 30,
            commute_mode: 'any',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'prop-2',
            pet_details: { dogsAllowed: true },
            noise_levels: null,
            sunlight_hours: null,
            soundproof_rating: null,
            commute_matrix: {},
          }],
        });

      const baseRecommendations = [
        { propertyId: 'prop-1', matchScore: 85 }, // Higher base score but no pets
        { propertyId: 'prop-2', matchScore: 75 }, // Lower base score but pets allowed
      ];

      const result = await lifestyleMatchingService.getLifestyleRecommendations(
        'tenant-rank',
        baseRecommendations
      );

      // prop-2 should be ranked higher due to lifestyle match
      expect(result[0].propertyId).toBe('prop-2');
      expect(result[0].combinedScore).toBeGreaterThan(result[1].combinedScore);
    });
  });
});
