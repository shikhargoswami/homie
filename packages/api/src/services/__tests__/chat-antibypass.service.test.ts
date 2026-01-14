/**
 * Tests for Chat Anti-Bypass Service
 * 
 * Tests phone number, email, social media, and 
 * external meeting detection patterns
 */

import { describe, it, expect } from '@jest/globals';
import { chatAntiBypassService } from '../chat-antibypass.service';
import { ChatViolationType } from '@homie/shared';

describe('ChatAntiBypassService', () => {
  describe('analyzeMessage - Phone Number Detection', () => {
    it('should detect standard Indian phone numbers', () => {
      const testCases = [
        '9876543210',
        '+91 9876543210',
        '91-9876543210',
        '+91-98765-43210',
        '098765 43210',
        'Call me at 9876543210',
        'My number is +919876543210',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.PHONE_NUMBER);
      }
    });

    it('should detect phone numbers written as words', () => {
      const testCases = [
        'nine eight seven six five four three two one zero',
        'My number is nine eight seven six five four three two one zero',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.PHONE_NUMBER);
      }
    });

    it('should detect obscured phone numbers', () => {
      const testCases = [
        '9@8@7@6@5@4@3@2@1@0',
        '9-8-7-6-5-4-3-2-1-0',
        '9.8.7.6.5.4.3.2.1.0',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.PHONE_NUMBER);
      }
    });

    it('should NOT flag normal numbers', () => {
      const testCases = [
        'The rent is 25000',
        'It has 3 bedrooms',
        'Available from 15th March',
        '2BHK apartment',
        'Price: 30000 per month',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(false);
      }
    });
  });

  describe('analyzeMessage - Email Detection', () => {
    it('should detect standard email addresses', () => {
      const testCases = [
        'john@gmail.com',
        'reach me at john.doe@example.com',
        'Email: landlord@property.co.in',
        'Contact: test_user@domain.org',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.EMAIL);
      }
    });

    it('should detect obscured email addresses', () => {
      const testCases = [
        'john at gmail dot com',
        'reach me at john AT example DOT com',
        'email: test at domain dot in',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.EMAIL);
      }
    });

    it('should NOT flag normal text with at/dot', () => {
      const testCases = [
        'Let us meet at the property',
        'The dot on the map shows location',
        'Available at 5 PM',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(false);
      }
    });
  });

  describe('analyzeMessage - Social Media Detection', () => {
    it('should detect social media handles', () => {
      const testCases = [
        'Find me on instagram: @john_doe',
        'My insta is john_landlord',
        'Add me on whatsapp',
        'Telegram: @property_owner',
        'FB: John Landlord',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.SOCIAL_MEDIA);
      }
    });

    it('should NOT flag false positives', () => {
      const testCases = [
        '@home sounds great',
        'The property @rent is good',
        '@morning visit works',
        '@thanks for the info',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(false);
      }
    });
  });

  describe('analyzeMessage - External Meeting Detection', () => {
    it('should detect attempts to arrange external meetings', () => {
      const testCases = [
        'Let\'s meet outside the app',
        'Contact me directly for better deal',
        'Give me your number',
        'Share your phone please',
        'Can we talk outside this platform',
        'Reach me on my personal number',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(true);
        expect(result.violationType).toBe(ChatViolationType.EXTERNAL_MEETING);
      }
    });

    it('should NOT flag legitimate meeting requests', () => {
      const testCases = [
        'Can we schedule a viewing?',
        'I would like to meet at the property',
        'When can I visit the flat?',
        'Please share property photos',
        'Let\'s discuss the rent',
      ];

      for (const message of testCases) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(false);
      }
    });
  });

  describe('sanitizeMessage', () => {
    it('should replace detected content with [CONTACT REMOVED]', () => {
      const result = chatAntiBypassService.analyzeMessage(
        'My number is 9876543210, call me!'
      );

      expect(result.sanitizedMessage).toContain('[CONTACT REMOVED]');
      expect(result.sanitizedMessage).not.toContain('9876543210');
    });
  });

  describe('Clean messages', () => {
    it('should allow normal property discussion messages', () => {
      const cleanMessages = [
        'Is the property still available?',
        'What is the rent for the 2BHK?',
        'Can I schedule a viewing for tomorrow?',
        'The location looks perfect for my commute',
        'Are pets allowed in this apartment?',
        'What amenities are included?',
        'Is there parking available?',
        'The monthly rent of 30000 works for me',
        'I am interested in the property',
        'Can you share more photos?',
        'When is the earliest move-in date?',
        'Is the deposit negotiable?',
      ];

      for (const message of cleanMessages) {
        const result = chatAntiBypassService.analyzeMessage(message);
        expect(result.isViolation).toBe(false);
      }
    });
  });
});
