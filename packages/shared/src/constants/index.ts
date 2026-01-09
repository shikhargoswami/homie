/**
 * Application-wide constants
 */

// Authentication
export const OTP_EXPIRY_SECONDS = 600; // 10 minutes
export const OTP_MAX_ATTEMPTS = 3;
export const JWT_EXPIRY_DAYS = 30;
export const REFRESH_TOKEN_EXPIRY_DAYS = 90;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Matching
export const MIN_MATCH_SCORE = 40; // Don't show properties with score < 40
export const MAX_DAILY_SWIPES_FREE = 20;
export const MAX_DAILY_SWIPES_PREMIUM = 9999;

// File uploads
export const MAX_PHOTO_COUNT = 15;
export const MAX_PHOTO_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Pricing
export const TENANT_PREMIUM_PRICE = 299; // ₹/month
export const LANDLORD_PRO_PRICE = 999; // ₹/month
export const LANDLORD_BUSINESS_PRICE = 2999; // ₹/month

// Features
export const FREE_SUPER_LIKES_PER_WEEK = 1;
export const PREMIUM_SUPER_LIKES_PER_WEEK = 5;

// Rent payment
export const RENT_PROCESSING_FEE_PERCENT = 1.5;
export const DEPOSIT_TRANSACTION_FEE_PERCENT = 3;

// Validation limits
export const MIN_RENT = 1000; // ₹
export const MAX_RENT = 10000000; // ₹
export const MIN_BUDGET = 1000; // ₹
export const MAX_BUDGET = 10000000; // ₹

// Date formats
export const ISO_DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'DD MMM YYYY';
