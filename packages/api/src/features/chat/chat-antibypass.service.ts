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
 * - Detect leetspeak and character substitution
 * - Detect spaced out characters
 * - Detect URLs and websites
 * - Detect code words and slang
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

// ============================================
// PHONE NUMBER PATTERNS (Enhanced)
// ============================================
const PHONE_PATTERNS = [
  // Standard formats (India)
  /\b(\+91|91|0)?[-.\s]?[6-9]\d{9}\b/g,
  // With spaces in the middle (e.g., "098765 43210" or "98765 43210")
  /\b0?[6-9]\d{4}[\s-]\d{5}\b/g,
  // With word separators (e.g., "nine eight seven...")
  /\b(nine|eight|seven|six|five|four|three|two|one|zero|nau|aath|saat|chhe|paanch|chaar|teen|do|ek|shunya)\b/gi,
  // Obscured with words (e.g., "987 six 543 two 10")
  /\b\d+\s*(six|seven|eight|nine|zero|one|two|three|four|five)\s*\d+/gi,
  // With symbols (e.g., "9@8@7...")
  /\b[6-9][\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d[\s@#\-\.\*\_\(\)]*\d\b/g,
  // Spaced out digits (e.g., "9 8 7 6 5 4 3 2 1 0")
  /\b[6-9]\s+\d\s+\d\s+\d\s+\d\s+\d\s+\d\s+\d\s+\d\s+\d\b/g,
  // Phonetic/word substitutions (e.g., "ate" = 8, "to/too" = 2, "for/fore" = 4, "won" = 1)
  /\b(ate|eight|ait)\b/gi,
  /\b(too?|two|tu)\b/gi,
  /\b(for|four|fore|fr)\b/gi,
  /\b(won|one|wan)\b/gi,
  /\b(tree|three|thre)\b/gi,
  /\b(sex|six|siks)\b/gi,
  /\b(heaven|seven|sevn)\b/gi,
  // With country code variations
  /\b(\+?91|zero\s*91|91)\s*[-.\s]?\s*[6-9]/gi,
  // Parentheses format (e.g., "(98765) 43210")
  /\(\d{5}\)\s*\d{5}/g,
  // Leetspeak numbers (0=o, 1=i/l, 3=e, 4=a, 5=s, 7=t, 8=b)
  /\b[6-9][oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9][\s\-\.]*[oileas0-9]\b/gi,
];

// ============================================
// EMAIL PATTERNS (Enhanced)
// ============================================
const EMAIL_PATTERNS = [
  // Standard email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  // Obscured (e.g., "john at gmail dot com")
  /\b[A-Za-z0-9._%+-]+\s*(at|@|[@])\s*[A-Za-z0-9.-]+\s*(dot|\.|\[dot\]|\(dot\))\s*(com|in|org|net|co\.in|gmail|yahoo|hotmail|outlook)\b/gi,
  // With spaces (e.g., "john @ gmail . com")
  /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Za-z]{2,}\b/g,
  // Leetspeak email (e.g., "john[at]gmail[dot]com")
  /\b[A-Za-z0-9._%+-]+\s*(\[at\]|\(at\)|\{at\})\s*[A-Za-z0-9.-]+\s*(\[dot\]|\(dot\)|\{dot\})\s*[A-Za-z]{2,}\b/gi,
  // Gmail/Yahoo/Hotmail mention with username
  /\b(gmail|yahoo|hotmail|outlook|proton|icloud)\s*[:\-]?\s*[A-Za-z0-9._%+-]+/gi,
  /\b[A-Za-z0-9._%+-]+\s*(gmail|yahoo|hotmail|outlook|protonmail|icloud)/gi,
  // "Mail me at" patterns
  /\b(mail|email)\s*(me|us)?\s*(at|on|to)?\s*[:\-]?\s*[A-Za-z0-9._%+-]+/gi,
];

// ============================================
// SOCIAL MEDIA PATTERNS (Enhanced)
// ============================================
const SOCIAL_MEDIA_PATTERNS = [
  // Instagram variations
  /\b(instagram|insta|ig|1nst4|1nst4gr4m|1g|inst@|inst@gram)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  /\b(insta|ig)\s*(id|handle|profile|account|username)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  /\bfollow\s*(me|us)\s*(on|@)?\s*(insta|ig|instagram)/gi,
  /\b(dm|message)\s*(me|us)?\s*(on|@)?\s*(insta|ig|instagram)/gi,
  
  // WhatsApp variations
  /\b(whatsapp|whats\s*app|watsapp|wats\s*app|wa|wp|wh4ts4pp|wh@ts@pp|w\.?a\.?)\s*[:\-]?\s*([\d\s@]+)?/gi,
  /\b(add|contact|message|text|call|ping|buzz|hit)\s+(me\s+)?(on\s+)?(whatsapp|whats\s*app|watsapp|wa|wp)\b/gi,
  /\bwa\s*(number|no|num|#)\b/gi,
  /\b(text|msg|message)\s*(me)?\s*(on)?\s*wa\b/gi,
  
  // Telegram variations
  /\b(telegram|tg|t\.me|telgram|tel3gram)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  /\b(dm|message)\s*(me|us)?\s*(on|@)?\s*(telegram|tg)\b/gi,
  
  // Facebook variations
  /\b(facebook|fb|f\.b\.|f@cebook|fbook)\s*[:\-]?\s*[A-Za-z0-9.]+/gi,
  /\b(dm|message|add)\s*(me|us)?\s*(on|@)?\s*(facebook|fb)\b/gi,
  
  // Snapchat
  /\b(snapchat|snap|sc|sn@p)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  /\b(add|snap)\s*(me)?\s*(on)?\s*(snapchat|snap|sc)\b/gi,
  
  // Twitter/X
  /\b(twitter|x\.com|tweet|tw1tter)\s*[:\-]?\s*@?[A-Za-z0-9._]+/gi,
  
  // LinkedIn
  /\b(linkedin|linked\s*in|l1nked1n)\s*[:\-]?\s*[A-Za-z0-9./]+/gi,
  
  // Discord
  /\b(discord|disc0rd|d1sc0rd)\s*[:\-]?\s*[A-Za-z0-9#._]+/gi,
  
  // Generic social handles
  /\b@[A-Za-z0-9._]{3,30}\b/g,
  
  // Generic "my handle/username is" patterns
  /\b(my|mera)\s*(handle|username|id|profile|account)\s*(is|hai|:)?\s*@?[A-Za-z0-9._]+/gi,
  
  // "DM me" generic
  /\b(dm|direct\s*message|slide\s*into)\s*(me|my)?\s*(dms|dm)?\b/gi,
];

// ============================================
// URL/WEBSITE PATTERNS (New)
// ============================================
const URL_PATTERNS = [
  // Standard URLs
  /\bhttps?:\/\/[^\s]+/gi,
  /\bwww\.[^\s]+/gi,
  // URL without protocol (e.g., "google.com", "mysite.in")
  /\b[A-Za-z0-9-]+\.(com|in|org|net|co\.in|io|me|xyz|app|site|online|live|info|biz|us|uk)\b/gi,
  // Obscured URLs
  /\b[A-Za-z0-9-]+\s*(dot|\.|\[dot\]|\(dot\))\s*(com|in|org|net|io)\b/gi,
  // Shortened URLs
  /\b(bit\.ly|tinyurl|goo\.gl|t\.co|shorturl|cutt\.ly|rb\.gy|is\.gd|v\.gd|tiny\.cc)\b/gi,
  // Link tree and similar
  /\b(linktr\.ee|linktree|beacons\.ai|bio\.link|allmylinks)\/?[A-Za-z0-9._-]*/gi,
];

// ============================================
// EXTERNAL MEETING PATTERNS (Enhanced)
// ============================================
const EXTERNAL_MEETING_PATTERNS = [
  /\b(meet|call|contact)\s*(me|us)\s*(outside|directly|personally|privately|offline)/gi,
  /\b(give|share|send|drop)\s+(me\s+)?(your|my|ur)?\s*(number|phone|mobile|contact|digits|no\.?|num)/gi,
  /\blet'?s?\s*(talk|chat|meet|connect)\s*(outside|off|beyond)\s*(this|the)?\s*(app|platform|chat)?/gi,
  /\b(can\s+we|we\s+can|shall\s+we|should\s+we)\s*(talk|chat|meet|connect)\s*(outside|off|beyond)?\s*(this|the)?\s*(app|platform)?/gi,
  /\b(reach|contact|ping|hit)\s*(me|out)\s*(on|via|through|at)\s*(my|personal)?/gi,
  // Code words / slang
  /\b(hit\s*me\s*up|hmu|lmk\s*your|drop\s*your|send\s*your|slide\s*in)\b/gi,
  /\b(my\s*digits|your\s*digits|the\s*digits)\b/gi,
  /\b(off\s*the\s*app|off\s*platform|outside\s*the\s*app|bypass)\b/gi,
  /\b(connect\s*outside|talk\s*privately|speak\s*directly|direct\s*contact)\b/gi,
  // "Let's not use this app"
  /\b(don'?t|no\s*need\s*to)\s*(use|need)\s*(this|the)?\s*(app|platform|chat)\b/gi,
  // "I'll share my number"
  /\b(i'?ll|let\s*me|can\s*i)\s*(share|give|send|drop)\s*(my|the)?\s*(number|contact|phone)/gi,
  // Asking for contact
  /\b(what'?s|what\s*is|share|give\s*me)\s*(your|ur)\s*(number|phone|contact|whatsapp|wa|insta)/gi,
  // "Call me on"
  /\b(call|ring|buzz|reach)\s*(me|us)\s*(on|at)\b/gi,
  // "Text me"
  /\b(text|sms|msg|message)\s*(me|us)\s*(on|at|directly)?\b/gi,
];

// ============================================
// SUSPICIOUS KEYWORD COMBINATIONS (New)
// ============================================
const SUSPICIOUS_COMBINATIONS = [
  // Number + sharing intent
  /\b(my|mera|apna)\s*(number|phone|mobile|contact)\s*(is|hai|:)/gi,
  /\b(number|phone|mobile|contact)\s*(share|send|give|de\s*do|bhej)/gi,
  // Specific apps + contact intent
  /\b(call|msg|message|text)\s*(karo|kar|kijiye|please)\s*(on|pe|par)?\s*(wa|whatsapp|phone)/gi,
  // "Personal" anything
  /\b(personal|private)\s*(number|phone|mobile|contact|id|account)\b/gi,
  // "Reach me at"
  /\breac(h|ch)\s*(me|us|out)\s*(at|on|@)/gi,
  // Platform avoidance
  /\b(don'?t|let'?s\s*not)\s*(use|chat\s*on|talk\s*on)\s*(this|the|here)/gi,
];

// ============================================
// LEETSPEAK CHARACTER MAP
// ============================================
const LEETSPEAK_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '6': 'g', '7': 't', '8': 'b', '9': 'g', '@': 'a',
  '$': 's', '!': 'i', '|': 'l', '+': 't',
};

// Number word to digit mapping (expanded)
const NUMBER_WORDS: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'ten': '10',
  // Hindi numbers
  'shunya': '0', 'ek': '1', 'do': '2', 'teen': '3', 'chaar': '4',
  'paanch': '5', 'chhe': '6', 'saat': '7', 'aath': '8', 'nau': '9',
  'das': '10',
  // Phonetic/sound-alike
  'won': '1', 'too': '2', 'to': '2', 'tu': '2', 'tree': '3', 'for': '4',
  'fore': '4', 'fir': '4', 'sex': '6', 'siks': '6', 'ate': '8',
  'ait': '8', 'nein': '9',
  // Ordinals as substitutes
  'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
};

class ChatAntiBypassService {
  /**
   * Normalize message for detection (convert leetspeak, remove spaces between chars)
   */
  private normalizeMessage(message: string): string {
    let normalized = message.toLowerCase();
    
    // Convert leetspeak characters
    for (const [leet, char] of Object.entries(LEETSPEAK_MAP)) {
      normalized = normalized.replace(new RegExp(`\\${leet}`, 'g'), char);
    }
    
    // Convert number words to digits
    for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
    }
    
    return normalized;
  }

  /**
   * Check for spaced-out text (e.g., "n u m b e r" or "p h o n e")
   */
  private detectSpacedText(message: string): { found: boolean; word?: string } {
    const suspiciousWords = [
      'number', 'phone', 'mobile', 'contact', 'whatsapp', 'instagram',
      'email', 'gmail', 'facebook', 'telegram', 'snapchat',
    ];
    
    const lowerMessage = message.toLowerCase();
    
    for (const word of suspiciousWords) {
      // Create spaced pattern (e.g., "n u m b e r" or "n.u.m.b.e.r" or "n-u-m-b-e-r")
      const spacedPattern = word.split('').join('[\\s\\-\\.\\*\\_]+');
      const regex = new RegExp(spacedPattern, 'gi');
      
      if (regex.test(lowerMessage)) {
        return { found: true, word };
      }
    }
    
    return { found: false };
  }

  /**
   * Analyze message for potential violations
   */
  analyzeMessage(message: string): DetectionResult {
    const normalizedMessage = this.normalizeMessage(message);
    const lowerMessage = message.toLowerCase();

    // Check for spaced-out text first (highest priority bypass attempt)
    const spacedResult = this.detectSpacedText(message);
    if (spacedResult.found) {
      const violationType = this.getViolationTypeForWord(spacedResult.word!);
      return {
        isViolation: true,
        violationType,
        detectedContent: spacedResult.word,
        sanitizedMessage: '[CONTACT REMOVED]',
        warningMessage: this.getWarningForType(violationType),
      };
    }

    // Check for URLs (high priority - often used to share contact links)
    const urlResult = this.detectURL(message);
    if (urlResult.isViolation) {
      return urlResult;
    }

    // Check for phone numbers (on both original and normalized)
    const phoneResult = this.detectPhoneNumber(message, normalizedMessage);
    if (phoneResult.isViolation) {
      return phoneResult;
    }

    // Check for email addresses
    const emailResult = this.detectEmail(message, normalizedMessage);
    if (emailResult.isViolation) {
      return emailResult;
    }

    // Check for social media handles
    const socialResult = this.detectSocialMedia(message, normalizedMessage);
    if (socialResult.isViolation) {
      return socialResult;
    }

    // Check for external meeting suggestions
    const meetingResult = this.detectExternalMeeting(message, normalizedMessage);
    if (meetingResult.isViolation) {
      return meetingResult;
    }

    // Check suspicious combinations
    const comboResult = this.detectSuspiciousCombinations(message, normalizedMessage);
    if (comboResult.isViolation) {
      return comboResult;
    }

    return { isViolation: false };
  }

  /**
   * Get violation type based on detected word
   */
  private getViolationTypeForWord(word: string): ChatViolationType {
    const socialWords = ['whatsapp', 'instagram', 'facebook', 'telegram', 'snapchat'];
    const emailWords = ['email', 'gmail'];
    
    if (socialWords.includes(word)) return ChatViolationType.SOCIAL_MEDIA;
    if (emailWords.includes(word)) return ChatViolationType.EMAIL;
    return ChatViolationType.PHONE_NUMBER;
  }

  /**
   * Get warning message for violation type
   */
  private getWarningForType(type: ChatViolationType): string {
    const warnings: Record<ChatViolationType, string> = {
      [ChatViolationType.PHONE_NUMBER]: '⚠️ Phone numbers are not allowed in chat. Please use the in-app viewing scheduler.',
      [ChatViolationType.EMAIL]: '⚠️ Email addresses are not allowed. Please communicate through the app.',
      [ChatViolationType.SOCIAL_MEDIA]: '⚠️ Social media handles are not allowed. Keep conversations on the platform.',
      [ChatViolationType.EXTERNAL_MEETING]: '⚠️ Please use the in-app viewing scheduler to arrange property visits safely.',
      [ChatViolationType.URL]: '⚠️ External links are not allowed in chat for safety reasons.',
    };
    return warnings[type] || '⚠️ This message contains restricted content.';
  }

  /**
   * Detect URLs and website links
   */
  private detectURL(message: string): DetectionResult {
    for (const pattern of URL_PATTERNS) {
      const matches = message.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out false positives (common domain endings in regular sentences)
        const filtered = matches.filter(m => {
          const lower = m.toLowerCase();
          // Allow mentions of common terms that might end with .com etc
          const falsePositives = ['google.com search', 'example.com'];
          return !falsePositives.some(fp => lower.includes(fp));
        });
        
        if (filtered.length > 0) {
          return {
            isViolation: true,
            violationType: ChatViolationType.URL,
            detectedContent: filtered[0],
            sanitizedMessage: this.sanitizeMessage(message, pattern),
            warningMessage: '⚠️ External links are not allowed in chat for safety reasons.',
          };
        }
      }
    }

    return { isViolation: false };
  }

  /**
   * Detect phone numbers in various formats
   */
  private detectPhoneNumber(message: string, normalizedMessage: string): DetectionResult {
    // Check both original and normalized message
    const messagesToCheck = [message, normalizedMessage];
    
    for (const msg of messagesToCheck) {
      for (const pattern of PHONE_PATTERNS) {
        const matches = msg.match(pattern);
        if (matches && matches.length > 0) {
          // For word patterns, count how many number words appear
          const numberWordPattern = /\b(nine|eight|seven|six|five|four|three|two|one|zero|nau|aath|saat|chhe|paanch|chaar|teen|do|ek|shunya|won|too?|tree|for|fore|ate)\b/gi;
          const numberWordMatches = msg.match(numberWordPattern);
          
          if (numberWordMatches && numberWordMatches.length >= 5) {
            // Found 5+ number words - likely a phone number
            return {
              isViolation: true,
              violationType: ChatViolationType.PHONE_NUMBER,
              detectedContent: 'Number words detected',
              sanitizedMessage: '[CONTACT REMOVED]',
              warningMessage: '⚠️ Phone numbers are not allowed in chat. Please use the in-app viewing scheduler.',
            };
          }
          
          // For digit patterns, validate it looks like a phone number
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
    }

    // Check for sequence of digits with any separators
    const digitSequence = normalizedMessage.replace(/[^0-9]/g, '');
    if (digitSequence.length >= 10) {
      // Check if first digit indicates Indian mobile (6-9)
      if (['6', '7', '8', '9'].includes(digitSequence[0]) || 
          (digitSequence.startsWith('91') && ['6', '7', '8', '9'].includes(digitSequence[2])) ||
          (digitSequence.startsWith('0') && ['6', '7', '8', '9'].includes(digitSequence[1]))) {
        return {
          isViolation: true,
          violationType: ChatViolationType.PHONE_NUMBER,
          detectedContent: digitSequence.substring(0, 12),
          sanitizedMessage: '[CONTACT REMOVED]',
          warningMessage: '⚠️ Phone numbers are not allowed in chat. Please use the in-app viewing scheduler.',
        };
      }
    }

    return { isViolation: false };
  }

  /**
   * Detect email addresses
   */
  private detectEmail(message: string, normalizedMessage: string): DetectionResult {
    const messagesToCheck = [message, normalizedMessage];
    
    for (const msg of messagesToCheck) {
      for (const pattern of EMAIL_PATTERNS) {
        const matches = msg.match(pattern);
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
    }

    return { isViolation: false };
  }

  /**
   * Detect social media handles
   */
  private detectSocialMedia(message: string, normalizedMessage: string): DetectionResult {
    const messagesToCheck = [message, normalizedMessage];
    
    for (const msg of messagesToCheck) {
      for (const pattern of SOCIAL_MEDIA_PATTERNS) {
        const matches = msg.match(pattern);
        if (matches && matches.length > 0) {
          // Filter out false positives
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
    }

    return { isViolation: false };
  }

  /**
   * Detect attempts to arrange external meetings
   */
  private detectExternalMeeting(message: string, normalizedMessage: string): DetectionResult {
    const messagesToCheck = [message, normalizedMessage];
    
    for (const msg of messagesToCheck) {
      for (const pattern of EXTERNAL_MEETING_PATTERNS) {
        const matches = msg.match(pattern);
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
    }

    return { isViolation: false };
  }

  /**
   * Detect suspicious keyword combinations
   */
  private detectSuspiciousCombinations(message: string, normalizedMessage: string): DetectionResult {
    const messagesToCheck = [message, normalizedMessage];
    
    for (const msg of messagesToCheck) {
      for (const pattern of SUSPICIOUS_COMBINATIONS) {
        const matches = msg.match(pattern);
        if (matches && matches.length > 0) {
          return {
            isViolation: true,
            violationType: ChatViolationType.EXTERNAL_MEETING,
            detectedContent: matches[0],
            sanitizedMessage: message,
            warningMessage: '⚠️ Sharing contact information is not allowed. Please use the in-app features.',
          };
        }
      }
    }

    return { isViolation: false };
  }

  /**
   * Check if detected handle is a false positive
   */
  private isFalsePositive(text: string): boolean {
    const falsePositives = [
      '@home', '@property', '@flat', '@room', '@rent', '@house', '@apartment',
      '@morning', '@evening', '@night', '@today', '@tomorrow', '@time', '@date',
      '@thanks', '@please', '@hello', '@hi', '@ok', '@okay', '@yes', '@no',
      '@price', '@cost', '@rent', '@deposit', '@month', '@year',
      '@bedroom', '@bathroom', '@kitchen', '@balcony', '@parking',
      'dm me if', // Allow "dm me if interested in property" context
    ];
    
    const lowerText = text.toLowerCase().trim();
    
    // Exact match check
    if (falsePositives.some(fp => lowerText === fp)) {
      return true;
    }
    
    // Check if it's just a single common word
    const commonSingleWords = ['@the', '@a', '@an', '@is', '@are', '@was', '@were', '@be', '@been', '@being'];
    if (commonSingleWords.some(w => lowerText === w)) {
      return true;
    }
    
    return false;
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
