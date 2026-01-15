import axios from 'axios';

/**
 * Google Maps Service
 * 
 * Purpose: Calculate commute time between property and work location
 * Also provides Places Autocomplete and Geocoding functionality
 * 
 * Why Google Maps?
 * - Accurate real-time traffic data
 * - Supports multiple transport modes
 * - Widely trusted by users
 * - Good free tier (40,000 requests/month)
 * - Excellent coverage in India
 * 
 * Alternative: Mapbox (cheaper but less accurate in India)
 */

interface Location {
  lat: number;
  lng: number;
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: Location;
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
  types: string[];
}

export interface GeocodingResult {
  formattedAddress: string;
  location: Location;
  placeId: string;
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
}

/**
 * Search for places using Google Places Autocomplete API
 * 
 * @param input - Search query string
 * @param types - Place types to filter (e.g., 'establishment', 'geocode')
 * @param location - Bias results towards this location
 * @param radius - Radius in meters to bias results
 * @returns Array of place predictions
 * 
 * API Documentation:
 * https://developers.google.com/maps/documentation/places/web-service/autocomplete
 */
export const searchPlaces = async (
  input: string,
  options?: {
    types?: string;
    location?: Location;
    radius?: number;
    components?: string; // Country restriction, e.g., 'country:in'
  }
): Promise<PlacePrediction[]> => {
  // In test environment, return mock data
  if (process.env.NODE_ENV === 'test') {
    return getMockPlacePredictions(input);
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not configured');
    return [];
  }

  if (!input || input.trim().length < 2) {
    return [];
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

    const params: Record<string, string> = {
      input: input.trim(),
      key: GOOGLE_MAPS_API_KEY,
      language: 'en',
    };

    if (options?.types) {
      params.types = options.types;
    }

    if (options?.location) {
      params.location = `${options.location.lat},${options.location.lng}`;
    }

    if (options?.radius) {
      params.radius = String(options.radius);
    }

    if (options?.components) {
      params.components = options.components;
    } else {
      // Default to India for Homie
      params.components = 'country:in';
    }

    const response = await axios.get(url, {
      params,
      timeout: 5000,
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', response.data.status, response.data.error_message);
      return [];
    }

    return (response.data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
      types: prediction.types || [],
    }));
  } catch (error) {
    console.error('❌ Places autocomplete failed:', error);
    return [];
  }
};

/**
 * Get place details by place ID
 * 
 * @param placeId - Google Place ID
 * @returns Place details including coordinates
 * 
 * API Documentation:
 * https://developers.google.com/maps/documentation/places/web-service/details
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  // In test environment, return mock data
  if (process.env.NODE_ENV === 'test') {
    return getMockPlaceDetails(placeId);
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not configured');
    return null;
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';

    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        fields: 'place_id,name,formatted_address,geometry,address_components,types',
        key: GOOGLE_MAPS_API_KEY,
        language: 'en',
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK') {
      console.error('Place Details API error:', response.data.status, response.data.error_message);
      return null;
    }

    const result = response.data.result;

    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      addressComponents: (result.address_components || []).map((comp: any) => ({
        longName: comp.long_name,
        shortName: comp.short_name,
        types: comp.types,
      })),
      types: result.types || [],
    };
  } catch (error) {
    console.error('❌ Place details fetch failed:', error);
    return null;
  }
};

/**
 * Geocode an address string to coordinates
 * 
 * @param address - Address string to geocode
 * @returns Geocoding result with coordinates
 * 
 * API Documentation:
 * https://developers.google.com/maps/documentation/geocoding
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  // In test environment, return mock data
  if (process.env.NODE_ENV === 'test') {
    return getMockGeocodingResult(address);
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not configured');
    return null;
  }

  if (!address || address.trim().length < 3) {
    return null;
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';

    const response = await axios.get(url, {
      params: {
        address: address.trim(),
        key: GOOGLE_MAPS_API_KEY,
        region: 'in', // Bias towards India
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK') {
      if (response.data.status === 'ZERO_RESULTS') {
        return null;
      }
      console.error('Geocoding API error:', response.data.status, response.data.error_message);
      return null;
    }

    const result = response.data.results[0];

    return {
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      placeId: result.place_id,
      addressComponents: (result.address_components || []).map((comp: any) => ({
        longName: comp.long_name,
        shortName: comp.short_name,
        types: comp.types,
      })),
    };
  } catch (error) {
    console.error('❌ Geocoding failed:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 * 
 * @param location - Coordinates to reverse geocode
 * @returns Geocoding result with address
 */
export const reverseGeocode = async (location: Location): Promise<GeocodingResult | null> => {
  // In test environment, return mock data
  if (process.env.NODE_ENV === 'test') {
    return getMockReverseGeocoding(location);
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not configured');
    return null;
  }

  try {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';

    const response = await axios.get(url, {
      params: {
        latlng: `${location.lat},${location.lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK') {
      console.error('Reverse Geocoding API error:', response.data.status);
      return null;
    }

    const result = response.data.results[0];

    return {
      formattedAddress: result.formatted_address,
      location,
      placeId: result.place_id,
      addressComponents: (result.address_components || []).map((comp: any) => ({
        longName: comp.long_name,
        shortName: comp.short_name,
        types: comp.types,
      })),
    };
  } catch (error) {
    console.error('❌ Reverse geocoding failed:', error);
    return null;
  }
};

// ============ Mock Data for Testing ============

function getMockPlacePredictions(input: string): PlacePrediction[] {
  // Validate input length (matches real API behavior)
  if (!input || input.length < 2) {
    return [];
  }

  const mockLocations: Record<string, PlacePrediction[]> = {
    manyata: [
      {
        placeId: 'ChIJ_mock_manyata',
        description: 'Manyata Tech Park, Nagavara, Bengaluru, Karnataka, India',
        mainText: 'Manyata Tech Park',
        secondaryText: 'Nagavara, Bengaluru, Karnataka, India',
        types: ['establishment', 'point_of_interest'],
      },
    ],
    electronic: [
      {
        placeId: 'ChIJ_mock_ecity',
        description: 'Electronic City, Bengaluru, Karnataka, India',
        mainText: 'Electronic City',
        secondaryText: 'Bengaluru, Karnataka, India',
        types: ['neighborhood', 'political'],
      },
    ],
    koramangala: [
      {
        placeId: 'ChIJ_mock_koramangala',
        description: 'Koramangala, Bengaluru, Karnataka, India',
        mainText: 'Koramangala',
        secondaryText: 'Bengaluru, Karnataka, India',
        types: ['neighborhood', 'political'],
      },
    ],
    whitefield: [
      {
        placeId: 'ChIJ_mock_whitefield',
        description: 'Whitefield, Bengaluru, Karnataka, India',
        mainText: 'Whitefield',
        secondaryText: 'Bengaluru, Karnataka, India',
        types: ['neighborhood', 'political'],
      },
    ],
  };

  const searchLower = input.toLowerCase();
  for (const [key, predictions] of Object.entries(mockLocations)) {
    if (searchLower.includes(key)) {
      return predictions;
    }
  }

  // Default mock for any search
  return [
    {
      placeId: `ChIJ_mock_${Date.now()}`,
      description: `${input}, Bengaluru, Karnataka, India`,
      mainText: input,
      secondaryText: 'Bengaluru, Karnataka, India',
      types: ['establishment'],
    },
  ];
}

function getMockPlaceDetails(placeId: string): PlaceDetails {
  const mockDetails: Record<string, PlaceDetails> = {
    'ChIJ_mock_manyata': {
      placeId: 'ChIJ_mock_manyata',
      name: 'Manyata Tech Park',
      formattedAddress: 'Manyata Tech Park, Nagavara, Bengaluru, Karnataka 560045, India',
      location: { lat: 13.0467, lng: 77.6217 },
      addressComponents: [
        { longName: 'Manyata Tech Park', shortName: 'Manyata Tech Park', types: ['establishment'] },
        { longName: 'Nagavara', shortName: 'Nagavara', types: ['sublocality'] },
        { longName: 'Bengaluru', shortName: 'Bengaluru', types: ['locality'] },
        { longName: 'Karnataka', shortName: 'KA', types: ['administrative_area_level_1'] },
        { longName: '560045', shortName: '560045', types: ['postal_code'] },
        { longName: 'India', shortName: 'IN', types: ['country'] },
      ],
      types: ['establishment', 'point_of_interest'],
    },
    'ChIJ_mock_koramangala': {
      placeId: 'ChIJ_mock_koramangala',
      name: 'Koramangala',
      formattedAddress: 'Koramangala, Bengaluru, Karnataka, India',
      location: { lat: 12.9352, lng: 77.6245 },
      addressComponents: [
        { longName: 'Koramangala', shortName: 'Koramangala', types: ['neighborhood'] },
        { longName: 'Bengaluru', shortName: 'Bengaluru', types: ['locality'] },
        { longName: 'Karnataka', shortName: 'KA', types: ['administrative_area_level_1'] },
        { longName: 'India', shortName: 'IN', types: ['country'] },
      ],
      types: ['neighborhood', 'political'],
    },
  };

  if (mockDetails[placeId]) {
    return mockDetails[placeId];
  }

  // Default mock
  return {
    placeId,
    name: 'Mock Location',
    formattedAddress: 'Mock Address, Bengaluru, Karnataka, India',
    location: { lat: 12.9716, lng: 77.5946 },
    addressComponents: [
      { longName: 'Bengaluru', shortName: 'Bengaluru', types: ['locality'] },
      { longName: 'Karnataka', shortName: 'KA', types: ['administrative_area_level_1'] },
      { longName: 'India', shortName: 'IN', types: ['country'] },
    ],
    types: ['establishment'],
  };
}

function getMockGeocodingResult(address: string): GeocodingResult | null {
  // Validate address length (matches real API behavior)
  if (!address || address.length < 3) {
    return null;
  }

  return {
    formattedAddress: `${address}, Bengaluru, Karnataka, India`,
    location: { lat: 12.9716, lng: 77.5946 },
    placeId: `ChIJ_mock_geocode_${Date.now()}`,
    addressComponents: [
      { longName: 'Bengaluru', shortName: 'Bengaluru', types: ['locality'] },
      { longName: 'Karnataka', shortName: 'KA', types: ['administrative_area_level_1'] },
      { longName: 'India', shortName: 'IN', types: ['country'] },
    ],
  };
}

function getMockReverseGeocoding(location: Location): GeocodingResult {
  return {
    formattedAddress: 'Mock Address, Bengaluru, Karnataka, India',
    location,
    placeId: `ChIJ_mock_reverse_${Date.now()}`,
    addressComponents: [
      { longName: 'Bengaluru', shortName: 'Bengaluru', types: ['locality'] },
      { longName: 'Karnataka', shortName: 'KA', types: ['administrative_area_level_1'] },
      { longName: 'India', shortName: 'IN', types: ['country'] },
    ],
  };
}

/**
 * Calculate commute time using Google Maps Distance Matrix API
 * 
 * @param origin - Property location
 * @param destination - Work location
 * @param mode - Transport mode (default: driving)
 * @returns Commute time in minutes
 * 
 * API Documentation:
 * https://developers.google.com/maps/documentation/distance-matrix
 */
export const calculateCommuteTime = async (
  origin: Location,
  destination: Location,
  mode: 'driving' | 'transit' | 'walking' | 'bicycling' = 'driving'
): Promise<number> => {
  // In test environment, return mock data
  if (process.env.NODE_ENV === 'test') {
    return 25; // Mock 25 minutes
  }
  
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not configured');
    return 30; // Default 30 minutes
  }
  
  try {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    
    const response = await axios.get(url, {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode,
        departure_time: 'now', // For real-time traffic
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000, // 5 second timeout
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }
    
    const element = response.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      throw new Error(`No route found: ${element.status}`);
    }
    
    // Duration in seconds, convert to minutes
    const durationMinutes = Math.ceil(element.duration.value / 60);
    
    return durationMinutes;
  } catch (error) {
    console.error('❌ Failed to calculate commute time:', error);
    return 30; // Default fallback
  }
};

/**
 * Batch calculate commute times for multiple properties
 * 
 * Why batch?
 * - Google Maps API charges per request
 * - Can send up to 25 origins × 25 destinations in one request
 * - 625x more efficient than individual requests
 */
export const batchCalculateCommuteTime = async (
  origins: Location[],
  destination: Location,
  mode: 'driving' | 'transit' | 'walking' | 'bicycling' = 'driving'
): Promise<number[]> => {
  if (process.env.NODE_ENV === 'test') {
    return origins.map(() => 25);
  }
  
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!GOOGLE_MAPS_API_KEY) {
    return origins.map(() => 30);
  }
  
  try {
    // Limit to 25 origins per request (API limit)
    const batchSize = 25;
    const batches = [];
    
    for (let i = 0; i < origins.length; i += batchSize) {
      batches.push(origins.slice(i, i + batchSize));
    }
    
    const allResults: number[] = [];
    
    for (const batch of batches) {
      const originsParam = batch.map(loc => `${loc.lat},${loc.lng}`).join('|');
      
      const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
      
      const response = await axios.get(url, {
        params: {
          origins: originsParam,
          destinations: `${destination.lat},${destination.lng}`,
          mode,
          departure_time: 'now',
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: 10000,
      });
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }
      
      const results = response.data.rows.map((row: any) => {
        const element = row.elements[0];
        if (element.status === 'OK') {
          return Math.ceil(element.duration.value / 60);
        }
        return 30; // Fallback
      });
      
      allResults.push(...results);
    }
    
    return allResults;
  } catch (error) {
    console.error('❌ Batch commute calculation failed:', error);
    return origins.map(() => 30);
  }
};
