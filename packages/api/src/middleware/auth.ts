import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { query } from '../database/client';
import { redisClient } from '../database/client';
import { UserRole } from '@homie/shared';

/**
 * Authentication Middleware
 * 
 * Purpose: Protect routes that require authentication
 * 
 * Usage:
 * router.get('/profile', authenticate, getProfile);
 * router.post('/property', authenticate, authorize(['landlord']), createProperty);
 */

/**
 * Extend Express Request type to include userId and userRole
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

/**
 * Authenticate user from JWT token
 * 
 * Steps:
 * 1. Extract token from Authorization header
 * 2. Verify token signature and expiry
 * 3. Check if token is blacklisted (logged out)
 * 4. Attach userId to request object
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted (user logged out)
    const blacklistKey = `token:blacklist:${token}`;
    const isBlacklisted = await redisClient.exists(blacklistKey);
    
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
        },
      });
      return;
    }
    
    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: (error as Error).message,
        },
      });
      return;
    }
    
    // Check if user still exists
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
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
    
    // Attach user info to request
    // Use role from database (not token) to ensure it's always current
    req.userId = decoded.userId;
    req.userRole = userResult.rows[0].role;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize user based on role
 * 
 * Usage:
 * router.post('/property', authenticate, authorize(['landlord', 'admin']), createProperty);
 * 
 * @param allowedRoles - Array of roles that can access this route
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.userRole;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
      return;
    }
    
    next();
  };
};

/**
 * Optional authentication (attach user if token present, but don't require it)
 * 
 * Useful for routes that work for both authenticated and unauthenticated users
 * Example: Property listing (auth users see matched properties, unauth users see all)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without authentication
      next();
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyAccessToken(token);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch (error) {
      // Invalid token, but don't fail request
      console.warn('Invalid token in optional auth:', error);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
