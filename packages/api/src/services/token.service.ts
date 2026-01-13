import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '@homie/shared';

/**
 * JWT Token Service
 * 
 * Why JWT?
 * - Stateless authentication (no database lookup on each request)
 * - Can store user info in token (userId, role)
 * - Industry standard, works across platforms
 * - Can be verified without database
 * 
 * Token structure:
 * - Access token: Short-lived (30 days), used for API requests
 * - Refresh token: Long-lived (90 days), used to get new access token
 */

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';
// Use seconds for JWT expiry (30 days = 30 * 24 * 60 * 60)
const JWT_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
const REFRESH_EXPIRY_SECONDS = 90 * 24 * 60 * 60;

/**
 * Generate access token (short-lived)
 * 
 * @param payload - User data to encode in token
 * @returns JWT access token string
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRY_SECONDS,
    issuer: 'homie-api',
    audience: 'homie-app',
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generate refresh token (long-lived)
 * 
 * Why separate refresh token?
 * - If access token is stolen, damage is limited (expires in 30 days)
 * - Refresh token stored securely (httpOnly cookie or secure storage)
 * - Can revoke refresh tokens (store in database)
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: REFRESH_EXPIRY_SECONDS,
    issuer: 'homie-api',
    audience: 'homie-app',
  };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

/**
 * Verify access token
 * 
 * @param token - JWT token string
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'homie-api',
      audience: 'homie-app',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      issuer: 'homie-api',
      audience: 'homie-app',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (useful for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Get token expiry date
 */
export const getTokenExpiry = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000); // Convert Unix timestamp to Date
};
