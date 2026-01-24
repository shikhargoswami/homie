-- ============================================
-- ENHANCED TENANT PROFILE SCHEMA
-- Comprehensive tenant information for landlord swipe feed
-- ============================================

-- ============================================
-- TENANT PROFILE ENHANCEMENTS
-- ============================================

-- Verification status fields
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS employment_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS income_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS police_verification BOOLEAN DEFAULT FALSE;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS previous_landlord_verified BOOLEAN DEFAULT FALSE;

-- Income and employment details
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS annual_income INTEGER;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS income_proof_submitted BOOLEAN DEFAULT FALSE;

-- Rental preferences
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS preferred_move_in DATE;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS preferred_lease_months INTEGER DEFAULT 12;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS looking_for_description TEXT;

-- Couple/Family info
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS is_couple BOOLEAN DEFAULT FALSE;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS family_size INTEGER DEFAULT 1;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE;

-- Location info
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS current_location VARCHAR(255);

-- Interest message (why they want this property)
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS interest_message TEXT;

-- ============================================
-- RENTAL HISTORY TABLE
-- Previous landlord references and ratings
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_rental_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Previous rental details
  landlord_name VARCHAR(255) NOT NULL,
  landlord_phone VARCHAR(20),
  property_address TEXT,
  
  -- Duration
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,
  
  -- Rating from landlord
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_text TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_history_tenant ON tenant_rental_history(tenant_id);

-- ============================================
-- MATCH ENHANCEMENTS
-- Store interest details from tenant
-- ============================================

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS tenant_interest_message TEXT;

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS tenant_move_in_date DATE;

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS tenant_lease_preference INTEGER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN tenant_profiles.is_verified IS 'Whether tenant has completed identity verification';
COMMENT ON COLUMN tenant_profiles.employment_verified IS 'Whether employment has been verified';
COMMENT ON COLUMN tenant_profiles.income_verified IS 'Whether income has been verified';
COMMENT ON COLUMN tenant_profiles.police_verification IS 'Whether police verification is complete';
COMMENT ON COLUMN tenant_profiles.previous_landlord_verified IS 'Whether previous landlord reference is verified';
COMMENT ON COLUMN tenant_profiles.annual_income IS 'Annual income in INR';
COMMENT ON COLUMN tenant_profiles.preferred_move_in IS 'Preferred move-in date';
COMMENT ON COLUMN tenant_profiles.preferred_lease_months IS 'Preferred lease duration in months';
COMMENT ON COLUMN tenant_profiles.is_couple IS 'Whether tenant is applying as a couple';
COMMENT ON COLUMN tenant_profiles.partner_name IS 'Partner name if applying as couple';
COMMENT ON COLUMN tenant_profiles.family_size IS 'Total family members who will live in property';
COMMENT ON COLUMN tenant_profiles.current_location IS 'Current residential location';
COMMENT ON COLUMN tenant_profiles.interest_message IS 'Default message about why tenant is looking';
COMMENT ON TABLE tenant_rental_history IS 'Previous rental history with landlord reviews';
COMMENT ON COLUMN matches.tenant_interest_message IS 'Personalized message from tenant about this specific property';
