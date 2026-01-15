import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

/**
 * Places Routes Tests
 * 
 * Tests for the Places API proxy endpoints
 */

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id', role: 'tenant' };
    next();
  },
}));

// Mock maps service with inline functions
jest.mock('../../services/maps.service', () => ({
  searchPlaces: jest.fn(),
  getPlaceDetails: jest.fn(),
  geocodeAddress: jest.fn(),
  reverseGeocode: jest.fn(),
}));

// Import routes AFTER mocking
import placesRoutes from '../places';
import { searchPlaces, getPlaceDetails, geocodeAddress, reverseGeocode } from '../../services/maps.service';

// Get mocked versions
const mockSearchPlaces = searchPlaces as jest.MockedFunction<typeof searchPlaces>;
const mockGetPlaceDetails = getPlaceDetails as jest.MockedFunction<typeof getPlaceDetails>;
const mockGeocodeAddress = geocodeAddress as jest.MockedFunction<typeof geocodeAddress>;
const mockReverseGeocode = reverseGeocode as jest.MockedFunction<typeof reverseGeocode>;

const app = express();
app.use(express.json());
app.use('/api/places', placesRoutes);

describe('Places Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/places/autocomplete', () => {
    it('should return place predictions for valid search', async () => {
      const mockPredictions = [
        {
          placeId: 'place-1',
          description: 'Manyata Tech Park, Bangalore',
          mainText: 'Manyata Tech Park',
          secondaryText: 'Bangalore',
          types: ['establishment'],
        },
      ];

      mockSearchPlaces.mockResolvedValue(mockPredictions);

      const response = await request(app)
        .get('/api/places/autocomplete')
        .query({ input: 'Manyata' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].mainText).toBe('Manyata Tech Park');
    });

    it('should return 400 for missing input', async () => {
      const response = await request(app)
        .get('/api/places/autocomplete');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should pass optional parameters to service', async () => {
      mockSearchPlaces.mockResolvedValue([]);

      await request(app)
        .get('/api/places/autocomplete')
        .query({
          input: 'test',
          types: 'establishment',
          lat: '12.9716',
          lng: '77.5946',
          radius: '50000',
        });

      expect(mockSearchPlaces).toHaveBeenCalledWith('test', {
        types: 'establishment',
        location: { lat: 12.9716, lng: 77.5946 },
        radius: 50000,
      });
    });

    it('should return empty array when no results', async () => {
      mockSearchPlaces.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/places/autocomplete')
        .query({ input: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/places/details/:placeId', () => {
    it('should return place details for valid ID', async () => {
      const mockDetails = {
        placeId: 'place-1',
        name: 'Manyata Tech Park',
        formattedAddress: 'Manyata Tech Park, Bangalore',
        location: { lat: 13.0467, lng: 77.6217 },
        addressComponents: [],
        types: ['establishment'],
      };

      mockGetPlaceDetails.mockResolvedValue(mockDetails);

      const response = await request(app)
        .get('/api/places/details/place-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Manyata Tech Park');
      expect(response.body.data.location.lat).toBe(13.0467);
    });

    it('should return 404 for non-existent place', async () => {
      mockGetPlaceDetails.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/places/details/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/places/geocode', () => {
    it('should geocode valid address', async () => {
      const mockResult = {
        formattedAddress: 'Koramangala, Bangalore, Karnataka, India',
        location: { lat: 12.9352, lng: 77.6245 },
        placeId: 'place-1',
        addressComponents: [],
      };

      mockGeocodeAddress.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/places/geocode')
        .query({ address: 'Koramangala, Bangalore' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.location.lat).toBe(12.9352);
    });

    it('should return 400 for missing address', async () => {
      const response = await request(app)
        .get('/api/places/geocode');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when address cannot be geocoded', async () => {
      mockGeocodeAddress.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/places/geocode')
        .query({ address: 'invalid address xyz' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/places/reverse-geocode', () => {
    it('should reverse geocode valid coordinates', async () => {
      const mockResult = {
        formattedAddress: 'Koramangala, Bangalore',
        location: { lat: 12.9352, lng: 77.6245 },
        placeId: 'place-1',
        addressComponents: [],
      };

      mockReverseGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/places/reverse-geocode')
        .query({ lat: '12.9352', lng: '77.6245' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.formattedAddress).toBe('Koramangala, Bangalore');
    });

    it('should return 400 for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/places/reverse-geocode');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/places/reverse-geocode')
        .query({ lat: 'invalid', lng: 'coords' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when coordinates cannot be reverse geocoded', async () => {
      mockReverseGeocode.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/places/reverse-geocode')
        .query({ lat: '0', lng: '0' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
