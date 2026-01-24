import { Router, Request, Response } from 'express';
import { searchPlaces, getPlaceDetails, geocodeAddress, reverseGeocode } from '../services/maps.service';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Places Routes
 * 
 * Provides Google Places API proxy endpoints for:
 * - Place autocomplete search
 * - Place details lookup
 * - Geocoding (address to coordinates)
 * - Reverse geocoding (coordinates to address)
 * 
 * Why proxy through our API?
 * 1. Keep API key secure (not exposed to client)
 * 2. Add rate limiting and usage tracking
 * 3. Add caching layer for popular searches
 * 4. Consistent error handling
 */

/**
 * GET /api/places/autocomplete
 * 
 * Search for places using autocomplete
 * Query params:
 * - input: Search query (required)
 * - types: Place types filter (optional, e.g., 'establishment')
 * - lat: Latitude for location bias (optional)
 * - lng: Longitude for location bias (optional)
 * - radius: Radius in meters for location bias (optional)
 */
router.get('/autocomplete', authenticate, async (req: Request, res: Response) => {
  try {
    const { input, types, lat, lng, radius } = req.query;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const options: {
      types?: string;
      location?: { lat: number; lng: number };
      radius?: number;
    } = {};

    if (types && typeof types === 'string') {
      options.types = types;
    }

    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        options.location = { lat: latitude, lng: longitude };
      }
    }

    if (radius) {
      const radiusNum = parseInt(radius as string, 10);
      if (!isNaN(radiusNum)) {
        options.radius = radiusNum;
      }
    }

    const predictions = await searchPlaces(input, options);

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('Places autocomplete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search places',
    });
  }
});

/**
 * GET /api/places/details/:placeId
 * 
 * Get details for a specific place
 */
router.get('/details/:placeId', authenticate, async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        error: 'Place ID is required',
      });
    }

    const details = await getPlaceDetails(placeId);

    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Place not found',
      });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get place details',
    });
  }
});

/**
 * GET /api/places/geocode
 * 
 * Geocode an address to coordinates
 * Query params:
 * - address: Address string to geocode (required)
 */
router.get('/geocode', authenticate, async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Could not geocode address',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to geocode address',
    });
  }
});

/**
 * GET /api/places/reverse-geocode
 * 
 * Reverse geocode coordinates to address
 * Query params:
 * - lat: Latitude (required)
 * - lng: Longitude (required)
 */
router.get('/reverse-geocode', authenticate, async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      });
    }

    const result = await reverseGeocode({ lat: latitude, lng: longitude });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Could not reverse geocode coordinates',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reverse geocode',
    });
  }
});

export default router;
