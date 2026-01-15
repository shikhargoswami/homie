-- Migration: Add landlord verification fields
-- Date: 2026-01-15
-- Description: Add verification status fields to landlord_profiles for trust & safety

-- Add verification status columns to landlord_profiles
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS id_document_type VARCHAR(20); -- 'aadhar', 'pan', 'passport', 'driving_license'
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS id_document_number_hash VARCHAR(255); -- Hashed for security
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS property_ownership_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS property_ownership_verified_at TIMESTAMP;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS property_documents_url TEXT; -- Stored document URLs (encrypted)

-- Verification badges and trust score
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS verification_level VARCHAR(20) DEFAULT 'basic' 
  CHECK (verification_level IN ('basic', 'verified', 'premium', 'trusted'));
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100);

-- Verification metadata
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS verification_skipped BOOLEAN DEFAULT FALSE;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS verification_skipped_at TIMESTAMP;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS last_verification_prompt TIMESTAMP;

-- Create index for verification lookups
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_verification_level ON landlord_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_trust_score ON landlord_profiles(trust_score);

-- Add comments for documentation
COMMENT ON COLUMN landlord_profiles.phone_verified IS 'Phone verification status (auto-verified via OTP login)';
COMMENT ON COLUMN landlord_profiles.email_verified IS 'Email verification status';
COMMENT ON COLUMN landlord_profiles.id_verified IS 'ID document verification status (Aadhar/PAN)';
COMMENT ON COLUMN landlord_profiles.id_document_type IS 'Type of ID document used: aadhar, pan, passport, driving_license';
COMMENT ON COLUMN landlord_profiles.property_ownership_verified IS 'Property ownership document verification';
COMMENT ON COLUMN landlord_profiles.verification_level IS 'Overall verification level: basic (phone only), verified (phone+email+id), premium (all verified), trusted (premium + good history)';
COMMENT ON COLUMN landlord_profiles.trust_score IS 'Trust score 0-100 based on verifications and user behavior';
