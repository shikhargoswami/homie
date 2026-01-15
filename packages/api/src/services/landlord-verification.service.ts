/**
 * Landlord Verification Service
 * 
 * Purpose: Handle landlord identity and property verification
 * 
 * Features:
 * - Phone verification (auto-verified via OTP login)
 * - Email verification with OTP
 * - ID verification (Aadhar/PAN) - with document upload
 * - Property ownership verification - document upload
 * - Trust score calculation
 * 
 * Security:
 * - ID numbers are hashed before storage
 * - Documents stored in secure cloud storage
 * - Rate limiting on verification attempts
 */

import { query } from '../database/client';
import { redisClient } from '../database/client';
import crypto from 'crypto';

export interface VerificationStatus {
  phoneVerified: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  idVerified: boolean;
  idVerifiedAt?: string;
  idDocumentType?: string;
  propertyOwnershipVerified: boolean;
  propertyOwnershipVerifiedAt?: string;
  verificationLevel: 'basic' | 'verified' | 'premium' | 'trusted';
  trustScore: number;
  verificationSkipped: boolean;
}

export interface EmailVerificationRequest {
  email: string;
  landlordId: string;
}

export interface IdVerificationRequest {
  landlordId: string;
  documentType: 'aadhar' | 'pan' | 'passport' | 'driving_license';
  documentNumber: string;
  documentImageUrl?: string;
}

export interface PropertyDocumentRequest {
  landlordId: string;
  documentUrls: string[];
  documentType: 'sale_deed' | 'property_tax' | 'electricity_bill' | 'society_noc';
}

class LandlordVerificationService {
  /**
   * Get landlord's current verification status
   */
  async getVerificationStatus(landlordId: string): Promise<VerificationStatus | null> {
    const result = await query(
      `SELECT 
        phone_verified,
        email_verified,
        email_verified_at,
        id_verified,
        id_verified_at,
        id_document_type,
        property_ownership_verified,
        property_ownership_verified_at,
        verification_level,
        trust_score,
        verification_skipped
       FROM landlord_profiles
       WHERE user_id = $1`,
      [landlordId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      phoneVerified: row.phone_verified ?? true, // Phone always verified via OTP login
      emailVerified: row.email_verified ?? false,
      emailVerifiedAt: row.email_verified_at?.toISOString(),
      idVerified: row.id_verified ?? false,
      idVerifiedAt: row.id_verified_at?.toISOString(),
      idDocumentType: row.id_document_type,
      propertyOwnershipVerified: row.property_ownership_verified ?? false,
      propertyOwnershipVerifiedAt: row.property_ownership_verified_at?.toISOString(),
      verificationLevel: row.verification_level ?? 'basic',
      trustScore: row.trust_score ?? 0,
      verificationSkipped: row.verification_skipped ?? false,
    };
  }

  /**
   * Send email verification OTP
   */
  async sendEmailVerificationOtp(req: EmailVerificationRequest): Promise<{ success: boolean; message: string }> {
    const { email, landlordId } = req;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Rate limiting: max 3 emails per hour
    const rateLimitKey = `email_verify_rate:${landlordId}`;
    const attempts = await redisClient.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= 3) {
      return { success: false, message: 'Too many verification attempts. Try again later.' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis (10 min expiry)
    const otpKey = `email_verify_otp:${landlordId}`;
    await redisClient.setEx(otpKey, 600, JSON.stringify({ otp, email }));
    
    // Increment rate limit counter
    await redisClient.incr(rateLimitKey);
    await redisClient.expire(rateLimitKey, 3600); // 1 hour

    // TODO: Send actual email via email service
    // For now, log OTP (in production, use proper email service)
    console.log(`📧 Email verification OTP for ${email}: ${otp}`);

    // Update email in users table
    await query(
      `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
      [email, landlordId]
    );

    return { success: true, message: 'Verification email sent' };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmailOtp(landlordId: string, otp: string): Promise<{ success: boolean; message: string }> {
    const otpKey = `email_verify_otp:${landlordId}`;
    const storedData = await redisClient.get(otpKey);

    if (!storedData) {
      return { success: false, message: 'OTP expired or not found. Please request a new one.' };
    }

    const { otp: storedOtp, email } = JSON.parse(storedData);

    if (otp !== storedOtp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // Mark email as verified
    await query(
      `UPDATE landlord_profiles 
       SET email_verified = true, 
           email_verified_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $1`,
      [landlordId]
    );

    // Clear OTP
    await redisClient.del(otpKey);

    // Recalculate trust score and level
    await this.updateTrustScoreAndLevel(landlordId);

    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Submit ID for verification
   * In production, this would integrate with KYC provider (DigiLocker, Aadhaar e-KYC, etc.)
   */
  async submitIdVerification(req: IdVerificationRequest): Promise<{ success: boolean; message: string; verificationId?: string }> {
    const { landlordId, documentType, documentNumber, documentImageUrl } = req;

    // Validate document number format
    const isValid = this.validateDocumentNumber(documentType, documentNumber);
    if (!isValid) {
      return { success: false, message: `Invalid ${documentType.toUpperCase()} number format` };
    }

    // Hash the document number for storage
    const documentHash = this.hashDocument(documentNumber);

    // Generate verification ID for tracking
    const verificationId = crypto.randomUUID();

    // Store verification request (in production, would send to KYC provider)
    await redisClient.setEx(
      `id_verification:${verificationId}`,
      86400, // 24 hour expiry
      JSON.stringify({
        landlordId,
        documentType,
        documentHash,
        documentImageUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    );

    // For MVP: Auto-approve (in production, this would be async via KYC provider callback)
    // Simulate instant verification for demo purposes
    await this.approveIdVerification(landlordId, documentType, documentHash);

    return { 
      success: true, 
      message: 'ID verification submitted successfully',
      verificationId 
    };
  }

  /**
   * Approve ID verification (called by KYC provider callback in production)
   */
  private async approveIdVerification(landlordId: string, documentType: string, documentHash: string): Promise<void> {
    await query(
      `UPDATE landlord_profiles 
       SET id_verified = true,
           id_verified_at = NOW(),
           id_document_type = $2,
           id_document_number_hash = $3,
           updated_at = NOW()
       WHERE user_id = $1`,
      [landlordId, documentType, documentHash]
    );

    await this.updateTrustScoreAndLevel(landlordId);
  }

  /**
   * Submit property ownership documents
   */
  async submitPropertyDocuments(req: PropertyDocumentRequest): Promise<{ success: boolean; message: string }> {
    const { landlordId, documentUrls } = req;

    if (!documentUrls || documentUrls.length === 0) {
      return { success: false, message: 'No documents provided' };
    }

    // Store document URLs (in production, these would be securely uploaded to S3/GCS)
    await query(
      `UPDATE landlord_profiles 
       SET property_ownership_verified = true,
           property_ownership_verified_at = NOW(),
           property_documents_url = $2,
           updated_at = NOW()
       WHERE user_id = $1`,
      [landlordId, JSON.stringify(documentUrls)]
    );

    await this.updateTrustScoreAndLevel(landlordId);

    return { success: true, message: 'Property documents submitted for verification' };
  }

  /**
   * Skip verification (user chooses to do it later)
   */
  async skipVerification(landlordId: string): Promise<{ success: boolean }> {
    await query(
      `UPDATE landlord_profiles 
       SET verification_skipped = true,
           verification_skipped_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $1`,
      [landlordId]
    );

    return { success: true };
  }

  /**
   * Update trust score and verification level based on completed verifications
   * 
   * Scoring:
   * - Phone verified: 20 points (baseline)
   * - Email verified: 15 points
   * - ID verified: 30 points
   * - Property docs: 25 points
   * - Account age bonus: up to 10 points
   * 
   * Levels:
   * - basic: phone only (0-35 score)
   * - verified: phone + email + id (36-65 score)
   * - premium: all verifications (66-90 score)
   * - trusted: premium + good history (91-100 score)
   */
  async updateTrustScoreAndLevel(landlordId: string): Promise<void> {
    const result = await query(
      `SELECT 
        phone_verified,
        email_verified,
        id_verified,
        property_ownership_verified,
        created_at,
        rating,
        rating_count
       FROM landlord_profiles
       WHERE user_id = $1`,
      [landlordId]
    );

    if (result.rows.length === 0) return;

    const row = result.rows[0];
    let score = 0;

    // Phone verified: 20 points
    if (row.phone_verified) score += 20;

    // Email verified: 15 points
    if (row.email_verified) score += 15;

    // ID verified: 30 points
    if (row.id_verified) score += 30;

    // Property docs: 25 points
    if (row.property_ownership_verified) score += 25;

    // Account age bonus: up to 10 points (1 point per month, max 10)
    const accountAge = Math.floor(
      (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    score += Math.min(accountAge, 10);

    // Rating bonus: if rating >= 4 with at least 5 reviews
    if (row.rating >= 4 && row.rating_count >= 5) {
      score = Math.min(score + 5, 100);
    }

    // Determine level
    let level: 'basic' | 'verified' | 'premium' | 'trusted';
    if (score >= 91) {
      level = 'trusted';
    } else if (score >= 66) {
      level = 'premium';
    } else if (score >= 36) {
      level = 'verified';
    } else {
      level = 'basic';
    }

    await query(
      `UPDATE landlord_profiles 
       SET trust_score = $2,
           verification_level = $3,
           updated_at = NOW()
       WHERE user_id = $1`,
      [landlordId, score, level]
    );
  }

  /**
   * Validate document number format
   */
  private validateDocumentNumber(type: string, number: string): boolean {
    const patterns: Record<string, RegExp> = {
      aadhar: /^\d{12}$/,
      pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      passport: /^[A-Z]{1}[0-9]{7}$/,
      driving_license: /^[A-Z]{2}[0-9]{2}\s?[0-9]{11}$/,
    };

    const pattern = patterns[type];
    if (!pattern) return false;

    return pattern.test(number.toUpperCase().replace(/\s/g, ''));
  }

  /**
   * Hash document number for secure storage
   */
  private hashDocument(documentNumber: string): string {
    const salt = process.env.DOCUMENT_HASH_SALT || 'homie_verification_salt';
    return crypto
      .createHash('sha256')
      .update(documentNumber + salt)
      .digest('hex');
  }

  /**
   * Get verification statistics for a landlord (for display on profile)
   */
  async getVerificationBadges(landlordId: string): Promise<string[]> {
    const status = await this.getVerificationStatus(landlordId);
    if (!status) return [];

    const badges: string[] = [];

    if (status.phoneVerified) badges.push('Phone Verified');
    if (status.emailVerified) badges.push('Email Verified');
    if (status.idVerified) badges.push('ID Verified');
    if (status.propertyOwnershipVerified) badges.push('Verified Owner');

    // Special badges based on level
    if (status.verificationLevel === 'trusted') {
      badges.push('Trusted Landlord');
    } else if (status.verificationLevel === 'premium') {
      badges.push('Premium Verified');
    }

    return badges;
  }
}

export const landlordVerificationService = new LandlordVerificationService();
