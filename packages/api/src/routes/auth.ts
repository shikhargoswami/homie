import express from 'express';
import {
  requestOTP,
  verifyOTP as verifyOTPController,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Authentication Routes
 * 
 * Public routes (no authentication required):
 * - POST /api/auth/request-otp
 * - POST /api/auth/verify-otp
 * - POST /api/auth/refresh-token
 * 
 * Protected routes (authentication required):
 * - POST /api/auth/logout
 * - GET /api/auth/me
 */

// Public routes
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTPController);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
