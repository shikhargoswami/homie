import express from 'express';
import { authenticate } from '../middleware/auth';
import { query } from '../database/client';

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authenticate);

/**
 * Get user preferences
 * GET /api/users/preferences
 */
router.get('/preferences', async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Get user's role
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const role = userResult.rows[0].role;

    if (role === 'tenant') {
      const prefResult = await query(
        `SELECT 
          search_type,
          budget_min,
          budget_max,
          preferences,
          lifestyle_tags,
          roommate_preferences,
          work_location_lat,
          work_location_lng,
          max_commute_minutes,
          commute_mode,
          occupation_type,
          gender
         FROM tenant_profiles
         WHERE user_id = $1`,
        [userId]
      );

      if (prefResult.rows.length === 0) {
        // Return default preferences for new users
        res.status(200).json({
          success: true,
          data: {
            preferences: {
              search_type: 'full_home',
              budget_min: 10000,
              budget_max: 50000,
              preferred_locations: [],
              preferred_configuration: '2bhk',
              preferred_furnishing: 'semi-furnished',
              preferred_amenities: [],
              pets_allowed: false,
              smoking_allowed: false,
              min_lease_duration: 11,
              move_in_date: null,
              workplace_location: null,
              // Lifestyle defaults (tech-1.md)
              lifestyle: {
                tags: [],
                maxCommuteMinutes: 30,
                commuteMode: 'any',
                workLocation: null,
              },
            },
          },
        });
        return;
      }

      // Merge preferences JSONB with budget fields
      const prefs = prefResult.rows[0].preferences || {};
      const row = prefResult.rows[0];
      res.status(200).json({
        success: true,
        data: {
          preferences: {
            search_type: row.search_type,
            budget_min: row.budget_min,
            budget_max: row.budget_max,
            ...prefs,
            // Lifestyle data (tech-1.md)
            lifestyle: {
              tags: row.lifestyle_tags || [],
              maxCommuteMinutes: row.max_commute_minutes || 30,
              commuteMode: row.commute_mode || 'any',
              workLocation: row.work_location_lat && row.work_location_lng 
                ? { lat: parseFloat(row.work_location_lat), lng: parseFloat(row.work_location_lng) }
                : null,
            },
            roommatePreferences: row.roommate_preferences || null,
            occupationType: row.occupation_type,
            gender: row.gender,
          },
        },
      });
    } else if (role === 'landlord') {
      const prefResult = await query(
        `SELECT 
          preferred_tenant_types,
          pets_allowed,
          smoking_allowed,
          min_lease_duration,
          verification_required
         FROM landlord_profiles
         WHERE user_id = $1`,
        [userId]
      );

      if (prefResult.rows.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            preferences: {
              preferred_tenant_types: ['working_professional'],
              pets_allowed: false,
              smoking_allowed: false,
              min_lease_duration: 11,
              verification_required: true,
            },
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { preferences: prefResult.rows[0] },
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid user role' },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Update user preferences
 * PUT /api/users/preferences
 */
router.put('/preferences', async (req, res, next) => {
  try {
    const userId = req.userId;
    const preferences = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Get user's role
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const role = userResult.rows[0].role;

    if (role === 'tenant') {
      // Handle both nested { preferences: {...} } and flat structure
      const prefs = preferences.preferences || preferences;
      
      // Extract lifestyle data (tech-1.md)
      const lifestyle = prefs.lifestyle || {};
      const lifestyleTags = lifestyle.tags || [];
      const maxCommuteMinutes = lifestyle.maxCommuteMinutes ?? 30;
      const commuteMode = lifestyle.commuteMode || 'any';
      const workLocation = lifestyle.workLocation || null;
      
      // Extract budget from nonNegotiables or top level
      const budgetMin = prefs.nonNegotiables?.budget?.min || prefs.budget_min || prefs.min_budget || 10000;
      const budgetMax = prefs.nonNegotiables?.budget?.max || prefs.budget_max || prefs.max_budget || 50000;
      
      // Upsert tenant preferences
      // Schema uses: search_type, budget_min, budget_max, preferences (JSONB), lifestyle columns
      await query(
        `INSERT INTO tenant_profiles (
          user_id, search_type, budget_min, budget_max, preferences,
          lifestyle_tags, max_commute_minutes, commute_mode, work_location_lat, work_location_lng,
          occupation_type, gender
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (user_id) DO UPDATE SET
          search_type = COALESCE($2, tenant_profiles.search_type),
          budget_min = COALESCE($3, tenant_profiles.budget_min),
          budget_max = COALESCE($4, tenant_profiles.budget_max),
          preferences = COALESCE($5, tenant_profiles.preferences),
          lifestyle_tags = COALESCE($6, tenant_profiles.lifestyle_tags),
          max_commute_minutes = COALESCE($7, tenant_profiles.max_commute_minutes),
          commute_mode = COALESCE($8, tenant_profiles.commute_mode),
          work_location_lat = $9,
          work_location_lng = $10,
          occupation_type = COALESCE($11, tenant_profiles.occupation_type),
          gender = COALESCE($12, tenant_profiles.gender),
          updated_at = NOW()`,
        [
          userId,
          prefs.search_type || 'full_home',
          budgetMin,
          budgetMax,
          JSON.stringify({
            preferred_locations: prefs.preferred_locations || [],
            preferred_configuration: prefs.preferred_configuration || '2bhk',
            preferred_furnishing: prefs.nonNegotiables?.furnishing || prefs.preferred_furnishing || 'semi-furnished',
            preferred_amenities: prefs.mustHaves?.amenities || prefs.preferred_amenities || [],
            pets_allowed: prefs.niceToHaves?.petFriendly ?? prefs.pets_allowed ?? false,
            smoking_allowed: prefs.smoking_allowed ?? false,
            min_lease_duration: prefs.min_lease_duration || 11,
            move_in_date: prefs.nonNegotiables?.moveInDate || prefs.move_in_date || null,
            workplace_location: prefs.workplace_location || null,
            // Store nested preferences from UI (nonNegotiables, mustHaves, niceToHaves)
            nonNegotiables: prefs.nonNegotiables,
            mustHaves: prefs.mustHaves,
            niceToHaves: prefs.niceToHaves,
          }),
          JSON.stringify(lifestyleTags),
          maxCommuteMinutes,
          commuteMode,
          workLocation?.lat || null,
          workLocation?.lng || null,
          prefs.occupationType || null,
          prefs.gender || null,
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
      });
    } else if (role === 'landlord') {
      // Upsert landlord preferences
      await query(
        `INSERT INTO landlord_profiles (
          user_id, preferred_tenant_types, pets_allowed, smoking_allowed,
          min_lease_duration, verification_required
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          preferred_tenant_types = COALESCE($2, landlord_profiles.preferred_tenant_types),
          pets_allowed = COALESCE($3, landlord_profiles.pets_allowed),
          smoking_allowed = COALESCE($4, landlord_profiles.smoking_allowed),
          min_lease_duration = COALESCE($5, landlord_profiles.min_lease_duration),
          verification_required = COALESCE($6, landlord_profiles.verification_required),
          updated_at = NOW()`,
        [
          userId,
          preferences.preferred_tenant_types || ['working_professional'],
          preferences.pets_allowed ?? false,
          preferences.smoking_allowed ?? false,
          preferences.min_lease_duration || 11,
          preferences.verification_required ?? true,
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid user role' },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const result = await query(
      `SELECT 
        u.id, u.name, u.phone, u.email, u.role, u.is_verified, u.created_at,
        CASE 
          WHEN u.role = 'tenant' THEN (
            SELECT json_build_object(
              'occupation', tp.occupation,
              'company', tp.company,
              'profile_photo', tp.profile_photo
            ) FROM tenant_profiles tp WHERE tp.user_id = u.id
          )
          WHEN u.role = 'landlord' THEN (
            SELECT json_build_object(
              'rating', lp.rating,
              'total_tenants', lp.total_tenants,
              'response_rate', lp.response_rate
            ) FROM landlord_profiles lp WHERE lp.user_id = u.id
          )
        END as profile_details
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, email, occupation, company, profilePhoto } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Update basic user info
    await query(
      `UPDATE users SET 
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        updated_at = NOW()
       WHERE id = $1`,
      [userId, name, email]
    );

    // Update profile details if tenant
    if (occupation || company || profilePhoto) {
      await query(
        `UPDATE tenant_profiles SET
          occupation = COALESCE($2, occupation),
          company = COALESCE($3, company),
          profile_photo = COALESCE($4, profile_photo),
          updated_at = NOW()
         WHERE user_id = $1`,
        [userId, occupation, company, profilePhoto]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Onboarding profile update - Sets user type and initial profile
 * PUT /api/users/profile/onboarding
 */
router.put('/profile/onboarding', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { userType, searchType, name, email, employmentStatus, propertiesCount, experience } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Determine role based on user type
    const role = userType === 'landlord' ? 'landlord' : 'tenant';

    // Update user role and name
    await query(
      `UPDATE users SET 
        role = $2,
        name = COALESCE($3, name),
        email = COALESCE($4, email),
        updated_at = NOW()
       WHERE id = $1`,
      [userId, role, name, email]
    );

    if (role === 'tenant') {
      // Create or update tenant profile
      await query(
        `INSERT INTO tenant_profiles (
          user_id, search_type, employment_status, budget_min, budget_max, preferences
        ) VALUES ($1, $2, $3, 10000, 50000, '{}')
        ON CONFLICT (user_id) DO UPDATE SET
          search_type = COALESCE($2, tenant_profiles.search_type),
          employment_status = COALESCE($3, tenant_profiles.employment_status),
          updated_at = NOW()`,
        [userId, searchType || 'full_home', employmentStatus || 'employed']
      );
    } else {
      // Create or update landlord profile
      await query(
        `INSERT INTO landlord_profiles (user_id, subscription_tier)
         VALUES ($1, 'free')
         ON CONFLICT (user_id) DO UPDATE SET
          updated_at = NOW()`,
        [userId]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding profile updated successfully',
      data: { role },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark profile as completed
 * PUT /api/users/profile/complete
 */
router.put('/profile/complete', async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    await query(
      `UPDATE users SET 
        profile_completed = true,
        updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile marked as completed',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
