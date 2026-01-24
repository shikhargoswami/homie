/**
 * Auth Feature Module
 * 
 * Handles the authentication user journey:
 * - Phone number input
 * - OTP verification
 * - User type selection
 * - Token management
 */

export * from './auth.controller';
export { default as authRoutes } from './auth.routes';
export * from './sms.service';
export * from './token.service';
