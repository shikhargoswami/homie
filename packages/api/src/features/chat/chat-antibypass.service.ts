/**
 * Chat Anti-Bypass Detection Service
 * 
 * Purpose: Prevent users from sharing contact information
 * to bypass the platform's chat and booking system.
 * 
 * Based on tech-1.md platform integrity requirements:
 * - Detect phone numbers in various formats
 * - Detect email addresses
 * - Detect social media handles
 * - Detect attempts to arrange external meetings
 * 
 * Monetization Impact:
 * - Platform earns through facilitated viewings
 * - Direct contact sharing bypasses platform fees
 * - Protects both parties from scams
 */

import { query } from '../database/client';
import {
  ChatViolationType,
  ChatViolationAction,
} from '@homie/shared';

interface DetectionResult {
  isViolation: boolean;
  violationType?: ChatViolationType;
  detectedContent?: string;
  sanitizedMessage?: string;
  warningMessage?: string;
}

interface UserViolationHistory {
  totalViolations: number;
  recentViolations: number; // Last 30 days
  lastAction?: ChatViolationAction;
}

// Phone number patterns (India-focused)
const PHONE_PATTERNS = [
  // Standard formats
  /\b(\+91|91|0)?[-.\s]?[6-9]\d{9}\b/g,
  // With spaces in the middle (e.g., "098765 43210" or "98765 43210")
  /\b0?[6-9]\d{4}[\s-]\d{5}\b/g,
  // With word separators (e.g., "nine eight seven...")
  /\b(nine|eight|seven|six|five|four|three|two|one|zero|nau|aath|saat|chhe|paanch|chaar|teen|do|ek|shunya)\b/gi,
  // Obscured (e.g., "987 six 543 two 10")
  /\b\d+\s*(six|seven|eight|nine)\s*\d+/gi,
  // With symbols (e.g., "9@8@7...")
  /\b[6-9][\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d[\s@#\-\.]*\d\b/g,
];

// Email patterns
const EMAIL_PATTERNS = [
  // Standard email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  // Obscured (e.g., "john at gmail dot com")
  /\b[A-Za-z0-9._%+-]+\s*(at|@)\s*[A-Za-z0-9.-]+\s*(dot|\.)\s*(com|in|org|net|co\.in)\b/gi,
];

// Social media patterns
const SOCIAL_MEDIA_PATTERNS = [
  // Instagram
  /\b(instagram|insta|ig)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  /\b@[A-Za-z0-9._]{3,30}\b/g, // Generic handles
  // WhatsApp - detect mention of whatsapp even without numbers
  /\b(whatsapp|wa|wp)\s*[:\-]?\s*([\d\s@]+)?/gi,
  /\b(add|contact|message|text|call)\s+(me\s+)?(on\s+)?(whatsapp|wa|wp)\b/gi,
  // Telegram
  /\b(telegram|tg)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  // Facebook
  /\b(facebook|fb)\s*[:\-]?\s*[A-Za-z0-9.]+/gi,
];

// External meeting suggestion patterns
const EXTERNAL_MEETING_PATTERNS = [
  /\b(meet|call|contact)\s*(me|us)\s*(outside|directly|personally|privately)/gi,
  /\b(give|share|send)\s+(me\s+)?(your|my)?\s*(number|phone|mobile|contact)/gi,
  /\blet'?s?\s*(talk|chat|meet)\s*(outside|off)\s*(this|the)?\s*(app|platform)?/gi,
  /\b(can\s+we|we\s+can|shall\s+we)\s*(talk|chat|meet)\s*(outside|off)\s*(this|the)?\s*(app|platform)?/gi,
  /\b(reach|contact)\s*(me|out)\s*(on|via|through)\s*(my|personal)/gi,
];

// Number word to digit mapping
const NUMBER_WORDS: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  // Hindi numbers
  'shunya': '0', 'ek': '1', 'do': '2', 'teen': '3', 'chaar': '4',
  'paanch': '5', 'chhe': '6', 'saat': '7', 'aath': '8', 'nau': '9',
};

class ChatAntiBypassService {
  /**
   * Analyze message for potential violations
   */
  analyzeMessage(message: string): DetectionResult {
    const lowerMessage = message.toLowerCase();

    // Check for phone numbers
    const phoneResult = this.detectPhoneNumber(message);
    if (phoneResult.isViolation) {
      return phoneResult;
    }

    // Check for email addresses
    const emailResult = this.detectEmail(message);
    if (emailResult.isViolation) {
      return emailResult;
    }

    // Check for social media handles
    const socialResult = this.detectSocialMedia(message);
    if (socialResult.isViolation) {
      return socialResult;
    }

    // Check for external meeting suggestions
    const meetingResult = this.detectExternalMeeting(message);
    if (meetingResult.isViolation) {
      return meetingResult;
    }

    return { isViolation: false };
  }

  /**
   * Detect phone numbers in various formats
   */
  private detectPhoneNumber(message: string): DetectionResult {
    // Convert number words to digits
    let normalizedMessage = message.toLowerCase();
    for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
      normalizedMessage = normalizedMessage.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
    }

    // Check each pattern
    for (const pattern of PHONE_PATTERNS) {
      const matches = normalizedMessage.match(pattern);
      if (matches && matches.length > 0) {
        // Validate it looks like a phone number (10 digits after cleanup)
        const digits = matches[0].replace(/\D/g, '');
        if (digits.length >= 10) {
          return {
            isViolation: true,
            violationType: ChatViolationType.PHONE_NUMBER,
            detectedContent: matches[0],
            sanitizedMessage: this.sanitizeMessage(message, pattern),
            warningMessage: '⚠️ Phone numbers are not allowed in chat. Please use the in-app viewing scheduler.',
          };
        }
      }
    }

    return { isViolation: false };
  }

  /**
   * Detect email addresses
   */
  private detectEmail(message: string): DetectionResult {
    for (const pattern of EMAIL_PATTERNS) {
      const matches = message.match(pattern);
      if (matches && matches.length > 0) {
        return {
          isViolation: true,
          violationType: ChatViolationType.EMAIL,
          detectedContent: matches[0],
          sanitizedMessage: this.sanitizeMessage(message, pattern),
          warningMessage: '⚠️ Email addresses are not allowed. Please communicate through the app.',
        };
      }
    }

    return { isViolation: false };
  }

  /**
   * Detect social media handles
   */
  private detectSocialMedia(message: string): DetectionResult {
    for (const pattern of SOCIAL_MEDIA_PATTERNS) {
      const matches = message.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out false positives (common words starting with @)
        const filtered = matches.filter(m => !this.isFalsePositive(m));
        if (filtered.length > 0) {
          return {
            isViolation: true,
            violationType: ChatViolationType.SOCIAL_MEDIA,
            detectedContent: filtered[0],
            sanitizedMessage: this.sanitizeMessage(message, pattern),
            warningMessage: '⚠️ Social media handles are not allowed. Keep conversations on the platform.',
          };
        }
      }
    }

    return { isViolation: false };
  }

  /**
   * Detect attempts to arrange external meetings
   */
  private detectExternalMeeting(message: string): DetectionResult {
    for (const pattern of EXTERNAL_MEETING_PATTERNS) {
      const matches = message.match(pattern);
      if (matches && matches.length > 0) {
        return {
          isViolation: true,
          violationType: ChatViolationType.EXTERNAL_MEETING,
          detectedContent: matches[0],
          sanitizedMessage: message, // Don't sanitize, just warn
          warningMessage: '⚠️ Please use the in-app viewing scheduler to arrange property visits safely.',
        };
      }
    }

    return { isViolation: false };
  }

  /**
   * Check if detected handle is a false positive
   */
  private isFalsePositive(text: string): boolean {
    const falsePositives = [
      '@home', '@property', '@flat', '@room', '@rent',
      '@morning', '@evening', '@night', '@today', '@tomorrow',
      '@thanks', '@please', '@hello', '@hi',
    ];
    // Check for exact match only (the handle equals the false positive)
    const lowerText = text.toLowerCase().trim();
    return falsePositives.some(fp => lowerText === fp);
  }

  /**
   * Sanitize message by replacing detected content with [REMOVED]
   */
  private sanitizeMessage(message: string, pattern: RegExp): string {
    return message.replace(pattern, '[CONTACT REMOVED]');
  }

  /**
   * Record a violation in the database
   */
  async recordViolation(
    userId: string,
    conversationId: string,
    violation: DetectionResult
  ): Promise<{
    violationId: string;
    action: ChatViolationAction;
    userWarned: boolean;
    userBlocked: boolean;
  }> {
    // Get user's violation history
    const history = await this.getUserViolationHistory(userId);

    // Determine action based on history
    let action: ChatViolationAction;
    let userBlocked = false;

    if (history.recentViolations >= 5) {
      action = ChatViolationAction.SUSPENDED;
      userBlocked = true;
    } else if (history.recentViolations >= 3) {
      action = ChatViolationAction.BLOCKED;
      userBlocked = true;
    } else {
      action = ChatViolationAction.WARNED;
    }

    // Record violation
    const result = await query(
      `INSERT INTO chat_violations 
        (user_id, conversation_id, violation_type, detected_content, action_taken)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        userId,
        conversationId,
        violation.violationType,
        violation.detectedContent,
        action,
      ]
    );

    // Update user status if blocked/suspended
    if (userBlocked) {
      await this.updateUserBlockedStatus(userId, action);
    }

    return {
      violationId: result.rows[0].id,
      action,
      userWarned: action === ChatViolationAction.WARNED,
      userBlocked,
    };
  }

  /**
   * Get user's violation history
   */
  async getUserViolationHistory(userId: string): Promise<UserViolationHistory> {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent,
        MAX(action_taken) as last_action
       FROM chat_violations
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      totalViolations: parseInt(row.total, 10),
      recentViolations: parseInt(row.recent, 10),
      lastAction: row.last_action as ChatViolationAction | undefined,
    };
  }

  /**
   * Update user's blocked status
   */
  private async updateUserBlockedStatus(
    userId: string,
    action: ChatViolationAction
  ): Promise<void> {
    const status = action === ChatViolationAction.SUSPENDED 
      ? 'suspended' 
      : 'chat_restricted';

    await query(
      `UPDATE users 
       SET account_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, userId]
    );
  }

  /**
   * Check if user can send messages
   */
  async canUserSendMessages(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const history = await this.getUserViolationHistory(userId);

    if (history.lastAction === ChatViolationAction.SUSPENDED) {
      return {
        allowed: false,
        reason: 'Your account has been suspended due to repeated policy violations.',
      };
    }

    if (history.lastAction === ChatViolationAction.BLOCKED) {
      return {
        allowed: false,
        reason: 'Chat access is restricted. Please contact support.',
      };
    }

    return { allowed: true };
  }

  /**
   * Get violation statistics for admin dashboard
   */
  async getViolationStats(): Promise<{
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsLast7Days: number;
    violationsLast30Days: number;
    blockedUsers: number;
    suspendedUsers: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE action_taken = 'blocked') as blocked,
        COUNT(*) FILTER (WHERE action_taken = 'suspended') as suspended,
        violation_type,
        COUNT(*) as type_count
      FROM chat_violations
      GROUP BY violation_type
    `);

    const violationsByType: Record<string, number> = {};
    let totalViolations = 0;
    let violationsLast7Days = 0;
    let violationsLast30Days = 0;
    let blockedUsers = 0;
    let suspendedUsers = 0;

    for (const row of result.rows) {
      violationsByType[row.violation_type] = parseInt(row.type_count, 10);
      totalViolations += parseInt(row.type_count, 10);
      violationsLast7Days = parseInt(row.last_7_days, 10);
      violationsLast30Days = parseInt(row.last_30_days, 10);
      blockedUsers = parseInt(row.blocked, 10);
      suspendedUsers = parseInt(row.suspended, 10);
    }

    return {
      totalViolations,
      violationsByType,
      violationsLast7Days,
      violationsLast30Days,
      blockedUsers,
      suspendedUsers,
    };
  }
}

export const chatAntiBypassService = new ChatAntiBypassService();
export default chatAntiBypassService;
