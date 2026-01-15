import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { smsService } from '../sms.service';

/**
 * SMS Service Tests
 * 
 * Tests for OTP sending functionality
 * Note: In test environment, SMS is mocked and OTP is logged to console
 */

describe('SMS Service', () => {

  describe('sendOTP', () => {
    it('should return mock message SID in test environment', async () => {
      const result = await smsService.sendOTP('9876543210', '123456');
      
      expect(result).toBe('mock-message-sid');
    });

    it('should handle valid phone number format', async () => {
      const result = await smsService.sendOTP('+919876543210', '654321');
      
      expect(result).toBe('mock-message-sid');
    });

    it('should log OTP to console in test mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await smsService.sendOTP('9876543210', '123456');
      
      // In test environment, should log OTP
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('sendMessage', () => {
    it('should return mock message SID in test environment', async () => {
      const result = await smsService.sendMessage('9876543210', 'Test message');
      
      expect(result).toBe('mock-message-sid');
    });

    it('should log message to console in test mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await smsService.sendMessage('9876543210', 'Hello from Homie');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('isEnabled', () => {
    it('should return false in test environment', () => {
      expect(smsService.isEnabled()).toBe(false);
    });
  });
});
