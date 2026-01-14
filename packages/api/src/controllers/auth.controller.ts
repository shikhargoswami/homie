import { Request, Response, NextFunction } from 'express';
import { query, transaction } from '../database/client';
import { redisClient } from '../database/client';
import { smsService } from '../services/sms.service';
import { generateAccessToken, generateRefreshToken } from '../services/token.service';
import { generateOTP, getOTPExpiry, verifyOTP as verifyOTPUtil } from '../utils/otp';
import { validatePhone } from '@homie/shared';
import { OTP_EXPIRY_SECONDS, OTP_MAX_ATTEMPTS } from '@homie/shared';

/**
 * Authentication Controller
 * 
 * Flow:
 * 1. User enters phone number → Send OTP
 * 2. User enters OTP → Verify OTP
 * 3. Generate JWT tokens → Return to user
 * 4. User makes API requests with JWT in header
 */

/**
 * STEP 1: Request OTP
 * 
 * POST /api/auth/request-otp
 * Body: { phone: "9876543210" }
 * 
 * What happens:
 * 1. Validate phone number format
 * 2. Check rate limiting (max 3 OTPs per hour)
 * 3. Generate 6-digit OTP
 * 4. Store OTP in Redis (expires in 10 minutes)
 * 5. Send OTP via SMS
 * 6. Return success response (don't reveal if user exists)
 */
export const requestOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body;
    
    // Validate phone number
    if (!phone || !validatePhone(phone)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid phone number format',
        },
      });
      return;
    }
    
    // Clean phone number (remove spaces, dashes)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Rate limiting: Check if user has requested OTP recently
    // TODO: Reduce this to 3 in production for security
    const MAX_OTP_REQUESTS = process.env.NODE_ENV === 'production' ? 3 : 50; // 50 for testing, 3 for production
    const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
    
    const rateLimitKey = `otp:ratelimit:${cleanPhone}`;
    const recentRequests = await redisClient.get(rateLimitKey);
    
    if (recentRequests && parseInt(recentRequests) >= MAX_OTP_REQUESTS) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many OTP requests. Please try again in 1 hour.`,
        },
      });
      return;
    }
    
    // Generate OTP - Using hardcoded '123456' for testing (bypass Twilio)
    // TODO: Remove this in production and use generateOTP()
    const otp = process.env.NODE_ENV === 'production' ? generateOTP() : '123456';
    const expiresAt = getOTPExpiry(OTP_EXPIRY_SECONDS);
    
    // Store OTP in Redis (key: otp:{phone}, value: OTP code, TTL: 10 minutes)
    const otpKey = `otp:${cleanPhone}`;
    await redisClient.setEx(otpKey, OTP_EXPIRY_SECONDS, otp);
    
    // Log OTP to console for testing (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 [TEST MODE] OTP for ${cleanPhone}: ${otp}`);
    }
    
    // Store OTP attempts counter
    const attemptsKey = `otp:attempts:${cleanPhone}`;
    await redisClient.setEx(attemptsKey, OTP_EXPIRY_SECONDS, '0');
    
    // Update rate limit counter
    const currentCount = recentRequests ? parseInt(recentRequests) : 0;
    await redisClient.setEx(rateLimitKey, RATE_LIMIT_WINDOW, (currentCount + 1).toString());
    
    // Send OTP via SMS (skipped in test mode)
    if (process.env.NODE_ENV === 'production') {
      try {
        await smsService.sendOTP(cleanPhone, otp);
      } catch (error) {
        console.error('Failed to send OTP SMS:', error);
        // Don't fail the request, OTP is still stored
        // In production, you might want to retry or use backup SMS provider
      }
    } else {
      console.log(`📱 [TEST MODE] SMS skipped. Use OTP: ${otp}`);
    }
    
    // Log analytics event
    await query(
      `INSERT INTO analytics_events (event_type, metadata) 
       VALUES ('otp_requested', $1)`,
      [JSON.stringify({ phone: cleanPhone })]
    );
    
    res.status(200).json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        expiresIn: OTP_EXPIRY_SECONDS,
        phone: cleanPhone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STEP 2: Verify OTP and login
 * 
 * POST /api/auth/verify-otp
 * Body: { phone: "9876543210", otp: "123456" }
 * 
 * What happens:
 * 1. Validate inputs
 * 2. Get OTP from Redis
 * 3. Verify OTP matches and not expired
 * 4. Check if user exists (if not, create new user)
 * 5. Generate JWT access + refresh tokens
 * 6. Store session in database
 * 7. Return tokens + user data
 */
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    
    // Validate inputs
    if (!phone || !validatePhone(phone)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid phone number',
        },
      });
      return;
    }
    
    if (!otp || otp.length !== 6) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'OTP must be 6 digits',
        },
      });
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // TEST MODE: Bypass Redis check if OTP is '123456' in non-production
    const isTestBypass = process.env.NODE_ENV !== 'production' && otp === '123456';
    
    if (isTestBypass) {
      console.log(`🔓 [TEST MODE] OTP bypass for ${cleanPhone}`);
    }
    
    // Get stored OTP from Redis (skip in test bypass mode)
    const otpKey = `otp:${cleanPhone}`;
    const storedOTP = isTestBypass ? '123456' : await redisClient.get(otpKey);
    
    if (!storedOTP && !isTestBypass) {
      res.status(400).json({
        success: false,
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP expired or not found. Please request a new one.',
        },
      });
      return;
    }
    
    // Check OTP attempts (skip in test bypass mode)
    const attemptsKey = `otp:attempts:${cleanPhone}`;
    const attempts = isTestBypass ? '0' : await redisClient.get(attemptsKey);
    const attemptCount = attempts ? parseInt(attempts) : 0;
    
    if (attemptCount >= OTP_MAX_ATTEMPTS) {
      // Delete OTP after max attempts
      await redisClient.del(otpKey);
      await redisClient.del(attemptsKey);
      
      res.status(400).json({
        success: false,
        error: {
          code: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        },
      });
      return;
    }
    
    // Verify OTP
    if (otp !== storedOTP) {
      // Increment attempts
      await redisClient.incr(attemptsKey);
      
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP',
          attemptsRemaining: OTP_MAX_ATTEMPTS - attemptCount - 1,
        },
      });
      return;
    }
    
    // OTP is valid, delete from Redis
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);
    
    // Check if user exists or create new user
    let userResult = await query(
      'SELECT * FROM users WHERE phone = $1',
      [cleanPhone]
    );
    
    let user;
    
    if (userResult.rowCount === 0) {
      // New user, create account
      const newUserResult = await query(
        `INSERT INTO users (phone, name, role, profile_completed) 
         VALUES ($1, $2, 'tenant', false) 
         RETURNING *`,
        [cleanPhone, `User ${cleanPhone.slice(-4)}`] // Default name
      );
      user = newUserResult.rows[0];
      
      // Log analytics
      await query(
        `INSERT INTO analytics_events (user_id, event_type, metadata) 
         VALUES ($1, 'user_signup', $2)`,
        [user.id, JSON.stringify({ phone: cleanPhone })]
      );
    } else {
      // Existing user
      user = userResult.rows[0];
      
      // Update last login
      await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      // Log analytics
      await query(
        `INSERT INTO analytics_events (user_id, event_type, metadata) 
         VALUES ($1, 'user_login', $2)`,
        [user.id, JSON.stringify({ phone: cleanPhone })]
      );
    }
    
    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Store session in database
    await query(
      `INSERT INTO auth_sessions (
        user_id, phone, session_token, refresh_token, 
        token_expires_at, device_type, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        cleanPhone,
        accessToken,
        refreshToken,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        req.body.deviceType || 'unknown',
        req.ip,
        req.get('user-agent'),
      ]
    );
    
    // Return user data + tokens
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          profileCompleted: user.profile_completed,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 30 * 24 * 60 * 60, // seconds
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STEP 3: Refresh access token
 * 
 * POST /api/auth/refresh-token
 * Body: { refreshToken: "..." }
 * 
 * Why needed?
 * - Access token expires after 30 days
 * - Refresh token valid for 90 days
 * - Allows seamless re-authentication without OTP
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
        },
      });
      return;
    }
    
    // Verify refresh token
    let decoded;
    try {
      const { verifyRefreshToken } = await import('../services/token.service');
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
      return;
    }
    
    // Check if session exists in database
    const sessionResult = await query(
      'SELECT * FROM auth_sessions WHERE refresh_token = $1',
      [refreshToken]
    );
    
    if (sessionResult.rowCount === 0) {
      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found or expired',
        },
      });
      return;
    }
    
    // Get user data
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rowCount === 0) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }
    
    const user = userResult.rows[0];
    
    // Generate new access token (keep same refresh token)
    const newAccessToken = generateAccessToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });
    
    // Update session in database
    await query(
      `UPDATE auth_sessions 
       SET session_token = $1, token_expires_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE refresh_token = $3`,
      [
        newAccessToken,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        refreshToken,
      ]
    );
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 30 * 24 * 60 * 60,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STEP 4: Logout
 * 
 * POST /api/auth/logout
 * Headers: Authorization: Bearer {token}
 * 
 * What happens:
 * 1. Get token from header
 * 2. Delete session from database
 * 3. Add token to Redis blacklist (until expiry)
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });
      return;
    }
    
    // Delete session from database
    await query('DELETE FROM auth_sessions WHERE session_token = $1', [token]);
    
    // Add token to blacklist in Redis (expires when token would expire)
    const blacklistKey = `token:blacklist:${token}`;
    await redisClient.setEx(blacklistKey, 30 * 24 * 60 * 60, 'true'); // 30 days
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * 
 * GET /api/auth/me
 * Headers: Authorization: Bearer {token}
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User ID is set by auth middleware
    const userId = (req as any).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }
    
    // Get user data
    const userResult = await query(
      `SELECT u.*, 
        tp.search_type, tp.budget_min, tp.budget_max, tp.preferences as tenant_preferences,
        lp.subscription_tier, lp.rating as landlord_rating
       FROM users u
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       LEFT JOIN landlord_profiles lp ON u.id = lp.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }
    
    const user = userResult.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          profileCompleted: user.profile_completed,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at,
          // Include profile-specific data if available
          ...(user.search_type && {
            searchType: user.search_type,
            budgetMin: user.budget_min,
            budgetMax: user.budget_max,
          }),
          ...(user.subscription_tier && {
            subscriptionTier: user.subscription_tier,
            landlordRating: user.landlord_rating,
          }),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
