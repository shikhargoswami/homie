import express from 'express';
import {
  requestOTP,
  verifyOTP as verifyOTPController,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { query } from '../database/client';

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
 * 
 * Dev routes (development only):
 * - POST /api/auth/dev/reset-test-user
 */

// Public routes
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTPController);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

// Dev route: Reset test user (9999999999) to fresh state
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev/reset-test-user', async (req, res) => {
    try {
      const testPhone = '9999999999';
      
      // Get test user
      const userResult = await query('SELECT id FROM users WHERE phone = $1', [testPhone]);
      
      if (userResult.rowCount === 0) {
        // Create fresh test user
        await query(`
          INSERT INTO users (phone, email, name, role, profile_completed)
          VALUES ($1, 'test@homie.test', 'Test User', 'tenant', false)
        `, [testPhone]);
        
        res.json({ success: true, message: 'Test user created fresh' });
        return;
      }
      
      const userId = userResult.rows[0].id;
      
      // Delete all related data for test user (ignore errors for missing tables)
      const deleteQueries = [
        'DELETE FROM auth_sessions WHERE user_id = $1',
        'DELETE FROM tenant_profiles WHERE user_id = $1',
        'DELETE FROM chat_messages WHERE sender_id = $1',
        'DELETE FROM chat_participants WHERE user_id = $1',
        'DELETE FROM matches WHERE tenant_id = $1 OR landlord_id = $1',
        'DELETE FROM swipes WHERE user_id = $1',
        'DELETE FROM analytics_events WHERE user_id = $1',
      ];
      
      for (const sql of deleteQueries) {
        try {
          await query(sql, [userId]);
        } catch (e) {
          // Ignore errors for missing tables
        }
      }
      
      // Reset user to fresh state
      await query(`
        UPDATE users 
        SET name = 'Test User', 
            email = 'test@homie.test', 
            role = 'tenant', 
            profile_completed = false,
            last_login_at = NULL
        WHERE id = $1
      `, [userId]);
      
      console.log('🔧 Test user reset to fresh state');
      res.json({ success: true, message: 'Test user reset to fresh state' });
    } catch (error) {
      console.error('Failed to reset test user:', error);
      res.status(500).json({ success: false, error: 'Failed to reset test user' });
    }
  });
}

export default router;
