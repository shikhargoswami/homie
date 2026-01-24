import crypto from 'crypto';

/**
 * Generate random 6-digit OTP
 * 
 * Why 6 digits?
 * - 1 million combinations (10^6)
 * - Hard to brute force in 10 minutes
 * - Easy to remember and type
 * - Industry standard (banks, UPI)
 * 
 * Why crypto.randomInt over Math.random?
 * - Cryptographically secure (unpredictable)
 * - Math.random is predictable (seed-based)
 * - Security matters for authentication
 */
export const generateOTP = (): string => {
  // Generate random number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};

/**
 * Calculate OTP expiry time
 * 
 * @param seconds - Seconds until expiry (default 600 = 10 minutes)
 * @returns Date object representing expiry time
 */
export const getOTPExpiry = (seconds: number = 600): Date => {
  return new Date(Date.now() + seconds * 1000);
};

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate;
};

/**
 * Verify OTP matches and is not expired
 */
export const verifyOTP = (
  inputOTP: string,
  storedOTP: string,
  expiryDate: Date
): { valid: boolean; reason?: string } => {
  // Check expiry first
  if (isOTPExpired(expiryDate)) {
    return { valid: false, reason: 'OTP expired' };
  }
  
  // Check match
  if (inputOTP !== storedOTP) {
    return { valid: false, reason: 'OTP does not match' };
  }
  
  return { valid: true };
};
