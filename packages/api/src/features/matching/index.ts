/**
 * Matching Feature Module
 * 
 * Handles the matching user journey:
 * - Tenant-property matching
 * - Landlord-tenant matching
 * - Match notifications
 * - Match management
 */

export * from './matching.controller';
export * from './landlord-swipe.controller';
export { default as matchingRoutes } from './matching.routes';
export { default as matchesRoutes } from './matches.routes';
export * from './matching.service';
export * from './landlord-swipe.service';
