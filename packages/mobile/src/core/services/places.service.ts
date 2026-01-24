import { apiClient } from './api';

/**
 * Places Service
 * 
 * Provides Google Places functionality for location autocomplete
 * All requests are proxied through our API to keep the API key secure
 */

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
  location: {
    lat: number;
    lng: number;
  };
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
  types: string[];
}

export interface GeocodingResult {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  addressComponents: {
    longName: string;
    shortName: string;
    types: string[];
  }[];
}

/**
 * Search for places using autocomplete
 * 
 * @param input - Search query string
 * @param options - Optional filters
 * @returns Array of place predictions
 */
export const searchPlaces = async (
  input: string,
  options?: {
    types?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }
): Promise<PlacePrediction[]> => {
  try {
    if (!input || input.trim().length < 2) {
      return [];
    }

    const params = new URLSearchParams({ input: input.trim() });

    if (options?.types) {
      params.append('types', options.types);
    }
    if (options?.lat !== undefined && options?.lng !== undefined) {
      params.append('lat', String(options.lat));
      params.append('lng', String(options.lng));
    }
    if (options?.radius) {
      params.append('radius', String(options.radius));
    }

    const response = await apiClient.get(`/api/places/autocomplete?${params.toString()}`);

    if (response.data.success) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
};

/**
 * Get details for a specific place
 * 
 * @param placeId - Google Place ID
 * @returns Place details with coordinates
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  try {
    const response = await apiClient.get(`/api/places/details/${placeId}`);

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
};

/**
 * Geocode an address to coordinates
 * 
 * @param address - Address string
 * @returns Geocoding result with coordinates
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    if (!address || address.trim().length < 3) {
      return null;
    }

    const params = new URLSearchParams({ address: address.trim() });
    const response = await apiClient.get(`/api/places/geocode?${params.toString()}`);

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Geocoding result with address
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodingResult | null> => {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    const response = await apiClient.get(`/api/places/reverse-geocode?${params.toString()}`);

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Extract address components from place details
 * 
 * Helper function to parse address components
 */
export const extractAddressComponents = (
  details: PlaceDetails
): {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} => {
  const components = details.addressComponents;
  
  const findComponent = (types: string[]): string | undefined => {
    const component = components.find(c => 
      types.some(type => c.types.includes(type))
    );
    return component?.longName;
  };

  return {
    street: findComponent(['street_address', 'route', 'sublocality_level_2']),
    neighborhood: findComponent(['sublocality', 'sublocality_level_1', 'neighborhood']),
    city: findComponent(['locality', 'administrative_area_level_2']),
    state: findComponent(['administrative_area_level_1']),
    postalCode: findComponent(['postal_code']),
    country: findComponent(['country']),
  };
};
