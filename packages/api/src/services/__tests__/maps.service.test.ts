import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  calculateCommuteTime, 
  batchCalculateCommuteTime,
  searchPlaces,
  getPlaceDetails,
  geocodeAddress,
  reverseGeocode,
} from '../maps.service';

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

  describe('searchPlaces', () => {
    it('should return mock predictions for Manyata search', async () => {
      const results = await searchPlaces('Manyata');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('placeId');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('mainText');
      expect(results[0].mainText).toContain('Manyata');
    });

    it('should return mock predictions for Koramangala search', async () => {
      const results = await searchPlaces('Koramangala');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].mainText).toContain('Koramangala');
    });

    it('should return empty array for short input', async () => {
      const results = await searchPlaces('a');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should return empty array for empty input', async () => {
      const results = await searchPlaces('');
      
      expect(results).toHaveLength(0);
    });

    it('should accept optional parameters', async () => {
      const results = await searchPlaces('Electronic', {
        types: 'establishment',
        location: mockOrigin,
        radius: 50000,
      });
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getPlaceDetails', () => {
    it('should return mock details for known place ID', async () => {
      const details = await getPlaceDetails('ChIJ_mock_manyata');
      
      expect(details).not.toBeNull();
      expect(details).toHaveProperty('placeId');
      expect(details).toHaveProperty('name');
      expect(details).toHaveProperty('formattedAddress');
      expect(details).toHaveProperty('location');
      expect(details?.location).toHaveProperty('lat');
      expect(details?.location).toHaveProperty('lng');
    });

    it('should return mock details with address components', async () => {
      const details = await getPlaceDetails('ChIJ_mock_koramangala');
      
      expect(details).not.toBeNull();
      expect(details?.addressComponents).toBeInstanceOf(Array);
      expect(details?.addressComponents.length).toBeGreaterThan(0);
    });

    it('should return default mock for unknown place ID', async () => {
      const details = await getPlaceDetails('unknown-place-id');
      
      expect(details).not.toBeNull();
      expect(details).toHaveProperty('location');
    });
  });

  describe('geocodeAddress', () => {
    it('should return mock geocoding result', async () => {
      const result = await geocodeAddress('Koramangala, Bangalore');
      
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('formattedAddress');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('placeId');
      expect(result?.location.lat).toBeDefined();
      expect(result?.location.lng).toBeDefined();
    });

    it('should return null for short address', async () => {
      const result = await geocodeAddress('ab');
      
      expect(result).toBeNull();
    });

    it('should return null for empty address', async () => {
      const result = await geocodeAddress('');
      
      expect(result).toBeNull();
    });

    it('should include address components', async () => {
      const result = await geocodeAddress('HSR Layout, Bangalore');
      
      expect(result?.addressComponents).toBeInstanceOf(Array);
    });
  });

  describe('reverseGeocode', () => {
    it('should return mock reverse geocoding result', async () => {
      const result = await reverseGeocode(mockOrigin);
      
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('formattedAddress');
      expect(result).toHaveProperty('location');
      expect(result?.location.lat).toBe(mockOrigin.lat);
      expect(result?.location.lng).toBe(mockOrigin.lng);
    });

    it('should include address components', async () => {
      const result = await reverseGeocode(mockDestination);
      
      expect(result?.addressComponents).toBeInstanceOf(Array);
      expect(result?.addressComponents.length).toBeGreaterThan(0);
    });
  });
});
