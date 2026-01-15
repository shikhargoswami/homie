import { 
  searchPlaces, 
  getPlaceDetails, 
  geocodeAddress, 
  reverseGeocode,
  extractAddressComponents,
  PlaceDetails,
} from '../places.service';
import { apiClient } from '../api';

/**
 * Places Service Tests
 * 
 * Tests for the mobile places service
 */

// Mock API client
jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('Places Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPlaces', () => {
    it('should return predictions for valid search', async () => {
      const mockPredictions = [
        {
          placeId: 'place-1',
          description: 'Manyata Tech Park, Bangalore',
          mainText: 'Manyata Tech Park',
          secondaryText: 'Bangalore',
          types: ['establishment'],
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: true, data: mockPredictions },
      });

      const results = await searchPlaces('Manyata');

      expect(results).toHaveLength(1);
      expect(results[0].mainText).toBe('Manyata Tech Park');
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/places/autocomplete')
      );
    });

    it('should return empty array for short input', async () => {
      const results = await searchPlaces('a');

      expect(results).toEqual([]);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      const results = await searchPlaces('');

      expect(results).toEqual([]);
    });

    it('should pass optional parameters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: true, data: [] },
      });

      await searchPlaces('test', {
        types: 'establishment',
        lat: 12.9716,
        lng: 77.5946,
        radius: 50000,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringMatching(/types=establishment/)
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringMatching(/lat=12\.9716/)
      );
    });

    it('should handle API errors gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const results = await searchPlaces('Manyata');

      expect(results).toEqual([]);
    });

    it('should return empty array when API returns failure', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: false, error: 'API error' },
      });

      const results = await searchPlaces('test');

      expect(results).toEqual([]);
    });
  });

  describe('getPlaceDetails', () => {
    it('should return details for valid place ID', async () => {
      const mockDetails = {
        placeId: 'place-1',
        name: 'Manyata Tech Park',
        formattedAddress: 'Manyata Tech Park, Bangalore',
        location: { lat: 13.0467, lng: 77.6217 },
        addressComponents: [],
        types: ['establishment'],
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: true, data: mockDetails },
      });

      const result = await getPlaceDetails('place-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Manyata Tech Park');
      expect(result?.location.lat).toBe(13.0467);
    });

    it('should return null on API error', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getPlaceDetails('place-1');

      expect(result).toBeNull();
    });

    it('should return null when API returns failure', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: false, error: 'Not found' },
      });

      const result = await getPlaceDetails('invalid');

      expect(result).toBeNull();
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode valid address', async () => {
      const mockResult = {
        formattedAddress: 'Koramangala, Bangalore',
        location: { lat: 12.9352, lng: 77.6245 },
        placeId: 'place-1',
        addressComponents: [],
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: true, data: mockResult },
      });

      const result = await geocodeAddress('Koramangala, Bangalore');

      expect(result).not.toBeNull();
      expect(result?.location.lat).toBe(12.9352);
    });

    it('should return null for short address', async () => {
      const result = await geocodeAddress('ab');

      expect(result).toBeNull();
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should return null for empty address', async () => {
      const result = await geocodeAddress('');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await geocodeAddress('Koramangala');

      expect(result).toBeNull();
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode valid coordinates', async () => {
      const mockResult = {
        formattedAddress: 'Koramangala, Bangalore',
        location: { lat: 12.9352, lng: 77.6245 },
        placeId: 'place-1',
        addressComponents: [],
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: true, data: mockResult },
      });

      const result = await reverseGeocode(12.9352, 77.6245);

      expect(result).not.toBeNull();
      expect(result?.formattedAddress).toBe('Koramangala, Bangalore');
    });

    it('should handle API errors gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await reverseGeocode(12.9352, 77.6245);

      expect(result).toBeNull();
    });
  });

  describe('extractAddressComponents', () => {
    it('should extract all address components', () => {
      const mockDetails: PlaceDetails = {
        placeId: 'place-1',
        name: 'Test Place',
        formattedAddress: '123 Test Street, Koramangala, Bangalore, Karnataka 560034, India',
        location: { lat: 12.9352, lng: 77.6245 },
        types: ['establishment'],
        addressComponents: [
          { longName: '123 Test Street', shortName: '123 Test St', types: ['street_address'] },
          { longName: 'Koramangala', shortName: 'Koramangala', types: ['sublocality', 'sublocality_level_1'] },
          { longName: 'Bangalore', shortName: 'BLR', types: ['locality'] },
          { longName: 'Karnataka', shortName: 'KA', types: ['administrative_area_level_1'] },
          { longName: '560034', shortName: '560034', types: ['postal_code'] },
          { longName: 'India', shortName: 'IN', types: ['country'] },
        ],
      };

      const result = extractAddressComponents(mockDetails);

      expect(result.street).toBe('123 Test Street');
      expect(result.neighborhood).toBe('Koramangala');
      expect(result.city).toBe('Bangalore');
      expect(result.state).toBe('Karnataka');
      expect(result.postalCode).toBe('560034');
      expect(result.country).toBe('India');
    });

    it('should handle missing components', () => {
      const mockDetails: PlaceDetails = {
        placeId: 'place-1',
        name: 'Test Place',
        formattedAddress: 'Bangalore, India',
        location: { lat: 12.9352, lng: 77.6245 },
        types: ['establishment'],
        addressComponents: [
          { longName: 'Bangalore', shortName: 'BLR', types: ['locality'] },
          { longName: 'India', shortName: 'IN', types: ['country'] },
        ],
      };

      const result = extractAddressComponents(mockDetails);

      expect(result.street).toBeUndefined();
      expect(result.neighborhood).toBeUndefined();
      expect(result.city).toBe('Bangalore');
      expect(result.country).toBe('India');
    });

    it('should handle empty address components', () => {
      const mockDetails: PlaceDetails = {
        placeId: 'place-1',
        name: 'Test Place',
        formattedAddress: 'Unknown Location',
        location: { lat: 0, lng: 0 },
        types: [],
        addressComponents: [],
      };

      const result = extractAddressComponents(mockDetails);

      expect(result.street).toBeUndefined();
      expect(result.city).toBeUndefined();
      expect(result.country).toBeUndefined();
    });
  });
});
