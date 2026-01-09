import {
  validateEmail,
  validatePhone,
  validateBudget,
  validateAadhaar,
  validatePAN,
  validateRent,
  validateConfiguration,
  validateCoordinates,
  validateISODate,
  validateMatchScore,
} from '../index';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.in')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid Indian phone numbers', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('6123456789')).toBe(true);
      // expect(validatePhone('91-9876543210')).toBe(true); // With prefix
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(false); // Starts with 1
      expect(validatePhone('98765')).toBe(false); // Too short
      expect(validatePhone('abcdefghij')).toBe(false); // Not digits
    });
  });

  describe('validateBudget', () => {
    it('should accept valid budget ranges', () => {
      expect(validateBudget({ min: 10000, max: 50000 })).toBe(true);
    });

    it('should reject invalid budgets', () => {
      expect(validateBudget({ min: 50000, max: 10000 })).toBe(false); // min > max
      expect(validateBudget({ min: 0, max: 50000 })).toBe(false); // min is 0
      expect(validateBudget({ min: 10000, max: 20000000 })).toBe(false); // max too high
    });
  });

  describe('validateAadhaar', () => {
    it('should accept valid Aadhaar numbers', () => {
      expect(validateAadhaar('123456789012')).toBe(true);
      expect(validateAadhaar('1234-5678-9012')).toBe(true); // With dashes
    });

    it('should reject invalid Aadhaar numbers', () => {
      expect(validateAadhaar('12345')).toBe(false); // Too short
      expect(validateAadhaar('abcdefghijkl')).toBe(false); // Not digits
    });
  });

  describe('validatePAN', () => {
    it('should accept valid PAN numbers', () => {
      expect(validatePAN('ABCDE1234F')).toBe(true);
      expect(validatePAN('abcde1234f')).toBe(true); // Lowercase accepted
    });

    it('should reject invalid PAN numbers', () => {
      expect(validatePAN('12345ABCDE')).toBe(false); // Wrong format
      expect(validatePAN('ABCD1234F')).toBe(false); // Too short
    });
  });

  describe('validateRent', () => {
    it('should accept valid rent amounts', () => {
      expect(validateRent(35000)).toBe(true);
      expect(validateRent(1000)).toBe(true); // Minimum
      expect(validateRent(10000000)).toBe(true); // Maximum
    });

    it('should reject invalid rent amounts', () => {
      expect(validateRent(500)).toBe(false); // Too low
      expect(validateRent(20000000)).toBe(false); // Too high
    });
  });

  describe('validateConfiguration', () => {
    it('should accept valid configurations', () => {
      expect(validateConfiguration('2bhk')).toBe(true);
      expect(validateConfiguration('studio')).toBe(true);
    });

    it('should reject invalid configurations', () => {
      expect(validateConfiguration('invalid')).toBe(false);
      expect(validateConfiguration('6bhk')).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(validateCoordinates({ lat: 12.9716, lng: 77.5946 })).toBe(true); // Bangalore
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates({ lat: 100, lng: 77 })).toBe(false); // lat > 90
      expect(validateCoordinates({ lat: 12, lng: 200 })).toBe(false); // lng > 180
    });
  });

  describe('validateISODate', () => {
    it('should accept valid ISO dates', () => {
      expect(validateISODate('2026-02-01')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateISODate('invalid')).toBe(false);
      expect(validateISODate('2026-13-01')).toBe(false); // Month > 12
    });
  });

  describe('validateMatchScore', () => {
    it('should accept valid scores', () => {
      expect(validateMatchScore(0)).toBe(true);
      expect(validateMatchScore(100)).toBe(true);
      expect(validateMatchScore(50)).toBe(true);
    });

    it('should reject invalid scores', () => {
      expect(validateMatchScore(-1)).toBe(false);
      expect(validateMatchScore(101)).toBe(false);
    });
  });
});
