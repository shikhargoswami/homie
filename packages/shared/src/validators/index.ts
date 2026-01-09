/**
 * Validation utilities for user inputs
 * All validators return boolean (true = valid, false = invalid)
 */

/**
 * Validate email format
 * @example validateEmail('user@example.com') // true
 * @example validateEmail('invalid') // false
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indian phone number (10 digits, starting with 6-9)
 * @example validatePhone('9876543210') // true
 * @example validatePhone('1234567890') // false (starts with 1)
 */
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Validate budget range
 * @example validateBudget({ min: 10000, max: 50000 }) // true
 * @example validateBudget({ min: 50000, max: 10000 }) // false (min > max)
 */
export const validateBudget = (budget: { min: number; max: number }): boolean => {
  return budget.min > 0 && budget.max > budget.min && budget.max <= 10000000;
};

/**
 * Validate Aadhaar number (12 digits)
 * Note: Never store actual Aadhaar, only hash
 * @example validateAadhaar('123456789012') // true
 */
export const validateAadhaar = (aadhaar: string): boolean => {
  const cleaned = aadhaar.replace(/\D/g, '');
  return /^\d{12}$/.test(cleaned);
};

/**
 * Validate PAN number (format: ABCDE1234F)
 * @example validatePAN('ABCDE1234F') // true
 */
export const validatePAN = (pan: string): boolean => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
};

/**
 * Validate rent amount (₹1,000 to ₹10,00,000)
 * @example validateRent(35000) // true
 */
export const validateRent = (rent: number): boolean => {
  return rent >= 1000 && rent <= 10000000;
};

/**
 * Validate property configuration
 * @example validateConfiguration('2bhk') // true
 * @example validateConfiguration('invalid') // false
 */
export const validateConfiguration = (config: string): boolean => {
  const validConfigs = ['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk'];
  return validConfigs.includes(config.toLowerCase());
};

/**
 * Validate coordinates (latitude/longitude)
 * @example validateCoordinates({ lat: 12.9716, lng: 77.5946 }) // true (Bangalore)
 */
export const validateCoordinates = (coords: { lat: number; lng: number }): boolean => {
  return (
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
};

/**
 * Validate ISO date string
 * @example validateISODate('2026-02-01') // true
 * @example validateISODate('invalid') // false
 */
export const validateISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
};

/**
 * Validate match score (0-100)
 */
export const validateMatchScore = (score: number): boolean => {
  return score >= 0 && score <= 100;
};
