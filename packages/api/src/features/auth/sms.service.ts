import twilio from 'twilio';

/**
 * SMS Service for sending OTP codes
 * 
 * Why Twilio?
 * - Reliable delivery (99.95% uptime SLA)
 * - Global coverage including India
 * - Reasonable pricing (~₹0.50 per SMS)
 * - Good API documentation
 * - Free trial for development
 */

interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private config: SMSConfig;
  private enabled: boolean = false;
  
  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    };
    
    // Only initialize Twilio if credentials are provided AND in production/staging
    const hasCredentials = this.config.accountSid && 
                          this.config.authToken && 
                          this.config.phoneNumber;
    
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.NODE_ENV === 'staging';
    
    if (hasCredentials && this.config.accountSid.startsWith('AC')) {
      try {
        this.client = twilio(this.config.accountSid, this.config.authToken);
        this.enabled = true;
        console.log('✅ Twilio SMS service initialized');
      } catch (error) {
        console.warn('⚠️  Failed to initialize Twilio:', (error as Error).message);
        this.enabled = false;
      }
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.log('ℹ️  Twilio not configured - SMS will be logged to console');
      }
      this.enabled = false;
    }
  }
  
  /**
   * Send OTP SMS to phone number
   * 
   * @param phone - Indian phone number (10 digits)
   * @param otp - 6-digit OTP code
   * @returns Promise resolving to message SID
   */
  async sendOTP(phone: string, otp: string): Promise<string> {
    // In development/test or when Twilio not configured, just log the OTP
    if (!this.enabled || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      console.log(`\n📱 ============================================`);
      console.log(`   OTP for ${phone}: ${otp}`);
      console.log(`   Valid for 10 minutes`);
      console.log(`============================================\n`);
      return 'mock-message-sid';
    }
    
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }
    
    try {
      // Format phone number for international format
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const message = await this.client.messages.create({
        body: `Your Homie verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        from: this.config.phoneNumber,
        to: formattedPhone,
      });
      
      console.log(`✅ SMS sent to ${phone}, SID: ${message.sid}`);
      return message.sid;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      throw new Error('Failed to send OTP SMS');
    }
  }
  
  /**
   * Send custom SMS message
   */
  async sendMessage(phone: string, message: string): Promise<string> {
    if (!this.enabled || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      console.log(`\n📱 SMS to ${phone}: ${message}\n`);
      return 'mock-message-sid';
    }
    
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }
    
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: formattedPhone,
      });
      
      return result.sid;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }
  
  /**
   * Check if SMS service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const smsService = new SMSService();
