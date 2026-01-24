/**
 * Properties Feature Module
 * 
 * Handles the property management user journey:
 * - Add new properties
 * - Edit properties
 * - Property listings
 * - Places/location search
 * - Maps integration
 */

export * from './property.controller';
export { default as propertiesRoutes } from './properties.routes';
export { default as placesRoutes } from './places.routes';
export * from './maps.service';
