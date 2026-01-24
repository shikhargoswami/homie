/**
 * Subscription Feature Module
 * 
 * Handles the subscription/premium user journey:
 * - View subscription plans
 * - Upgrade/downgrade
 * - Billing management
 * - Feature gating
 */

export * from './subscription.controller';
export { default as subscriptionRoutes } from './subscription.routes';
export * from './subscription.service';
