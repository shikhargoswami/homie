/**
 * Onboarding Feature Module
 * 
 * Handles the user onboarding journey:
 * - Tenant profile setup
 * - Landlord profile setup
 * - Landlord verification
 * - Preferences configuration
 */

export * from './landlord-verification.controller';
export { default as usersRoutes } from './users.routes';
export * from './landlord-verification.service';
