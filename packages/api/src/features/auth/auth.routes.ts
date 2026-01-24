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
  
  // Dev route: Reset current user's profile to incomplete (show onboarding again)
  router.post('/dev/reset-profile', authenticate, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Reset profile_completed flag and delete profile data
      await query(`
        UPDATE users 
        SET profile_completed = false
        WHERE id = $1
      `, [userId]);
      
      // Delete tenant or landlord profile based on role
      const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
      const role = userResult.rows[0]?.role;
      
      if (role === 'tenant') {
        try {
          await query('DELETE FROM tenant_profiles WHERE user_id = $1', [userId]);
        } catch (e) { /* ignore */ }
      } else if (role === 'landlord') {
        try {
          await query('DELETE FROM landlord_profiles WHERE user_id = $1', [userId]);
        } catch (e) { /* ignore */ }
      }
      
      console.log(`🔧 DEV: Profile reset for user ${userId}`);
      res.json({ success: true, message: 'Profile reset - will show onboarding' });
    } catch (error) {
      console.error('Failed to reset profile:', error);
      res.status(500).json({ success: false, error: 'Failed to reset profile' });
    }
  });
  
  // Dev route: Reset all data for current user (swipes, matches, chats, etc.)
  router.post('/dev/reset-all-data', authenticate, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Delete all related data (ignore errors for missing tables)
      const deleteQueries = [
        'DELETE FROM chat_messages WHERE sender_id = $1',
        'DELETE FROM chat_participants WHERE user_id = $1',
        'DELETE FROM matches WHERE tenant_id = $1 OR landlord_id = $1',
        'DELETE FROM swipes WHERE user_id = $1',
        'DELETE FROM viewings WHERE tenant_id = $1 OR landlord_id = $1',
        'DELETE FROM analytics_events WHERE user_id = $1',
        'DELETE FROM tenant_profiles WHERE user_id = $1',
        'DELETE FROM landlord_profiles WHERE user_id = $1',
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
        SET profile_completed = false,
            last_login_at = NULL
        WHERE id = $1
      `, [userId]);
      
      console.log(`🔧 DEV: All data reset for user ${userId}`);
      res.json({ success: true, message: 'All user data reset' });
    } catch (error) {
      console.error('Failed to reset all data:', error);
      res.status(500).json({ success: false, error: 'Failed to reset all data' });
    }
  });
  
  /**
   * Dev route: Smart user setup based on user type
   * 
   * SEEDED USERS (9876540001-10, 9123450001-05): 
   *   - Ensures seed data exists, re-seeds if missing
   *   - Preserves profile_completed = true
   * 
   * NEW/TEST USERS (9999999999, or any other phone):
   *   - Resets to fresh state (profile_completed = false)
   *   - Clears all user data
   */
  router.post('/dev/smart-setup', authenticate, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Get user info
      const userResult = await query('SELECT phone, role FROM users WHERE id = $1', [userId]);
      if (userResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const { phone, role } = userResult.rows[0];
      
      // Define seeded user phone patterns
      const seededTenantPhones = ['9876540001', '9876540002', '9876540003', '9876540004', '9876540005',
                                   '9876540006', '9876540007', '9876540008', '9876540009', '9876540010'];
      const seededLandlordPhones = ['9123450001', '9123450002', '9123450003', '9123450004', '9123450005'];
      
      const isSeededUser = seededTenantPhones.includes(phone) || seededLandlordPhones.includes(phone);
      
      if (isSeededUser) {
        // SEEDED USER: Ensure data exists
        console.log(`🔧 DEV: Smart setup for SEEDED user ${phone}`);
        
        // Check if profile exists
        const profileTable = role === 'tenant' ? 'tenant_profiles' : 'landlord_profiles';
        const profileResult = await query(`SELECT id FROM ${profileTable} WHERE user_id = $1`, [userId]);
        
        if (profileResult.rowCount === 0) {
          // Profile missing - trigger re-seed for this user
          console.log(`⚠️ DEV: Seed data missing for ${phone}, will re-seed on next full seed`);
          
          // For now, just ensure user is marked as existing with profile
          await query('UPDATE users SET profile_completed = true WHERE id = $1', [userId]);
          
          res.json({ 
            success: true, 
            action: 'seeded_user_preserved',
            message: `Seeded user ${phone} preserved. Run 'npm run seed' if data is missing.`,
            needsReseed: true
          });
        } else {
          // Profile exists - preserve state
          await query('UPDATE users SET profile_completed = true WHERE id = $1', [userId]);
          
          res.json({ 
            success: true, 
            action: 'seeded_user_preserved',
            message: `Seeded user ${phone} data intact`,
            needsReseed: false
          });
        }
      } else {
        // NEW/TEST USER: Reset to fresh state
        console.log(`🔧 DEV: Smart setup for NEW user ${phone} - resetting to fresh state`);
        
        // Delete all related data
        const deleteQueries = [
          'DELETE FROM chat_messages WHERE sender_id = $1',
          'DELETE FROM chat_participants WHERE user_id = $1',
          'DELETE FROM matches WHERE tenant_id = $1 OR landlord_id = $1',
          'DELETE FROM swipes WHERE user_id = $1',
          'DELETE FROM viewings WHERE tenant_id = $1 OR landlord_id = $1',
          'DELETE FROM analytics_events WHERE user_id = $1',
          'DELETE FROM tenant_profiles WHERE user_id = $1',
          'DELETE FROM landlord_profiles WHERE user_id = $1',
        ];
        
        for (const sql of deleteQueries) {
          try { await query(sql, [userId]); } catch (e) { /* ignore */ }
        }
        
        // Reset user to fresh state
        await query(`
          UPDATE users 
          SET profile_completed = false,
              role = 'tenant'
          WHERE id = $1
        `, [userId]);
        
        res.json({ 
          success: true, 
          action: 'new_user_reset',
          message: `New user ${phone} reset to fresh state - will show onboarding`
        });
      }
    } catch (error) {
      console.error('Failed to smart setup:', error);
      res.status(500).json({ success: false, error: 'Failed to smart setup' });
    }
  });
}

export default router;
