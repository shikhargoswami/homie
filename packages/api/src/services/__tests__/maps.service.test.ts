import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { calculateCommuteTime, batchCalculateCommuteTime } from '../maps.service';

/**
 * Maps Service Tests
 * 
 * Tests for Google Maps API integration
 * Note: In test environment, returns mock data
 */

describe('Maps Service', () => {
  const mockOrigin = { lat: 12.9716, lng: 77.5946 }; // Bangalore
  const mockDestination = { lat: 12.9352, lng: 77.6245 }; // Koramangala

  describe('calculateCommuteTime', () => {
    it('should return mock commute time in test environment', async () => {
      const result = await calculateCommuteTime(mockOrigin, mockDestination);
      
      expect(result).toBe(25); // Mock returns 25 minutes
    });

    it('should accept different transport modes', async () => {
      const drivingResult = await calculateCommuteTime(mockOrigin, mockDestination, 'driving');
      const transitResult = await calculateCommuteTime(mockOrigin, mockDestination, 'transit');
      const walkingResult = await calculateCommuteTime(mockOrigin, mockDestination, 'walking');
      const bicyclingResult = await calculateCommuteTime(mockOrigin, mockDestination, 'bicycling');
      
      // All should return mock value in test env
      expect(drivingResult).toBe(25);
      expect(transitResult).toBe(25);
      expect(walkingResult).toBe(25);
      expect(bicyclingResult).toBe(25);
    });

    it('should handle valid location coordinates', async () => {
      const result = await calculateCommuteTime(
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 }
      );
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('batchCalculateCommuteTime', () => {
    it('should return array of commute times', async () => {
      const origins = [
        { lat: 12.9716, lng: 77.5946 },
        { lat: 12.9352, lng: 77.6245 },
        { lat: 12.9166, lng: 77.6101 },
      ];
      
      const results = await batchCalculateCommuteTime(origins, mockDestination);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(3);
      results.forEach(time => {
        expect(typeof time).toBe('number');
        expect(time).toBe(25); // Mock value
      });
    });

    it('should handle empty origins array', async () => {
      const results = await batchCalculateCommuteTime([], mockDestination);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should accept different transport modes', async () => {
      const origins = [mockOrigin];
      
      const drivingResults = await batchCalculateCommuteTime(origins, mockDestination, 'driving');
      const transitResults = await batchCalculateCommuteTime(origins, mockDestination, 'transit');
      
      expect(drivingResults).toHaveLength(1);
      expect(transitResults).toHaveLength(1);
    });
  });
});
