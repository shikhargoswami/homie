-- ============================================
-- HOMIE PLATFORM DATABASE SCHEMA
-- PostgreSQL 15+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Base table for all user types)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('tenant', 'landlord', 'admin')),
  
  -- Verification status
  aadhaar_hash VARCHAR(255), -- SHA-256 hash, never store actual Aadhaar
  aadhaar_verified BOOLEAN DEFAULT FALSE,
  pan_hash VARCHAR(255),
  pan_verified BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  
  -- Indexes for fast lookups
  CONSTRAINT phone_format CHECK (phone ~ '^[6-9][0-9]{9}$')
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'Base user table for tenants, landlords, and admins';
COMMENT ON COLUMN users.aadhaar_hash IS 'SHA-256 hash of Aadhaar number (never store plaintext)';

-- ============================================
-- TENANT PROFILES (Extended info for tenants)
-- ============================================

CREATE TABLE tenant_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Search preferences
  search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('full_home', 'room_sharing')),
  
  -- Budget
  budget_min INTEGER NOT NULL CHECK (budget_min >= 1000),
  budget_max INTEGER NOT NULL CHECK (budget_max >= budget_min),
  
  -- Preferences (stored as JSONB for flexibility)
  preferences JSONB NOT NULL DEFAULT '{}',
  
  -- Reputation
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER DEFAULT 0,
  previous_leases INTEGER DEFAULT 0,
  
  -- Employment info (for landlord screening)
  employment_status VARCHAR(100),
  company_name VARCHAR(255),
  monthly_income INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_tenant_profiles_user_id ON tenant_profiles(user_id);
CREATE INDEX idx_tenant_profiles_budget ON tenant_profiles(budget_min, budget_max);
CREATE INDEX idx_tenant_profiles_preferences ON tenant_profiles USING GIN(preferences);

COMMENT ON COLUMN tenant_profiles.preferences IS 'JSON object with non-negotiables, must-haves, nice-to-haves';

-- ============================================
-- LANDLORD PROFILES
-- ============================================

CREATE TABLE landlord_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription
  subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  subscription_expires_at TIMESTAMP,
  
  -- Reputation
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER DEFAULT 0,
  total_tenants INTEGER DEFAULT 0,
  avg_time_to_rent INTEGER DEFAULT 0, -- in days
  
  -- Payment info
  bank_account_number VARCHAR(50),
  ifsc_code VARCHAR(11),
  pan_number VARCHAR(10),
  gst_number VARCHAR(15),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_landlord_profiles_user_id ON landlord_profiles(user_id);
CREATE INDEX idx_landlord_profiles_subscription ON landlord_profiles(subscription_tier);

-- ============================================
-- PROPERTIES
-- ============================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Location
  address TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  neighborhood VARCHAR(255),
  city VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
  pincode VARCHAR(6),
  
  -- Configuration
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'studio', 'pg')),
  configuration VARCHAR(50) NOT NULL, -- '1bhk', '2bhk', etc.
  size_sqft INTEGER NOT NULL CHECK (size_sqft > 0),
  floor_number INTEGER,
  total_floors INTEGER,
  age_years INTEGER,
  facing VARCHAR(10), -- 'N', 'E', 'W', 'S', 'NE', etc.
  furnishing VARCHAR(50) NOT NULL CHECK (furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
  
  -- Pricing
  rent INTEGER NOT NULL CHECK (rent >= 1000 AND rent <= 10000000),
  security_deposit INTEGER NOT NULL CHECK (security_deposit >= 0),
  maintenance_charge INTEGER DEFAULT 0,
  
  -- Features (JSONB for flexibility)
  amenities JSONB DEFAULT '[]', -- Array of amenity strings
  utilities JSONB DEFAULT '{}', -- Object with utility details
  features JSONB DEFAULT '{}', -- Object with feature flags
  
  -- Media
  photos JSONB DEFAULT '[]', -- Array of photo URLs
  vr_tour_url TEXT,
  floor_plan_url TEXT,
  
  -- Tenant preferences (set by landlord)
  tenant_preferences JSONB DEFAULT '{}',
  
  -- Lease terms
  min_lease_duration INTEGER DEFAULT 12, -- months
  max_lease_duration INTEGER,
  notice_period INTEGER DEFAULT 60, -- days
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'pending', 'archived')),
  available_from DATE NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'premium')),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- Geographic search index
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  )
);

CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);
CREATE INDEX idx_properties_rent ON properties(rent);
CREATE INDEX idx_properties_configuration ON properties(configuration);
CREATE INDEX idx_properties_available_from ON properties(available_from);
CREATE INDEX idx_properties_amenities ON properties USING GIN(amenities);

COMMENT ON TABLE properties IS 'All rental properties listed on platform';
COMMENT ON COLUMN properties.amenities IS 'Array of amenity strings: ["gym", "swimming_pool", "parking"]';

-- ============================================
-- MATCHES (Swipe results between tenant & property)
-- ============================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Match details
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  
  -- Swipe status
  tenant_swiped BOOLEAN DEFAULT FALSE,
  tenant_swipe_direction VARCHAR(10), -- 'right', 'left', 'super_like'
  tenant_swiped_at TIMESTAMP,
  
  landlord_swiped BOOLEAN DEFAULT FALSE,
  landlord_swipe_direction VARCHAR(10),
  landlord_swiped_at TIMESTAMP,
  
  -- Match status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'interested', 'declined', 'active')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one match per tenant-property pair
  UNIQUE(tenant_id, property_id)
);

CREATE INDEX idx_matches_tenant ON matches(tenant_id);
CREATE INDEX idx_matches_property ON matches(property_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_score ON matches(match_score DESC);

COMMENT ON TABLE matches IS 'Matching records between tenants and properties';
COMMENT ON COLUMN matches.match_score IS 'Algorithm-calculated match score (0-100)';

-- ============================================
-- DEALS (Active rental agreements)
-- ============================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Deal status
  status VARCHAR(50) NOT NULL DEFAULT 'negotiating' CHECK (status IN ('negotiating', 'agreed', 'signed', 'active', 'completed')),
  
  -- Negotiated terms
  final_rent INTEGER NOT NULL,
  final_deposit INTEGER NOT NULL,
  move_in_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  lockin_period INTEGER, -- months
  notice_period INTEGER, -- days
  
  -- Payment method
  deposit_payment_method VARCHAR(50) CHECK (deposit_payment_method IN ('full_deposit', 'insurance', 'flexible')),
  deposit_insurance_id UUID, -- Reference to insurance policy if chosen
  
  -- Agreement
  agreement_url TEXT,
  agreement_signed_at TIMESTAMP,
  
  -- Acceptance
  tenant_accepted BOOLEAN DEFAULT FALSE,
  landlord_accepted BOOLEAN DEFAULT FALSE,
  
  -- Milestones
  move_in_at TIMESTAMP,
  move_out_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(match_id)
);

CREATE INDEX idx_deals_tenant ON deals(tenant_id);
CREATE INDEX idx_deals_landlord ON deals(landlord_id);
CREATE INDEX idx_deals_property ON deals(property_id);
CREATE INDEX idx_deals_status ON deals(status);

-- ============================================
-- AUTH SESSIONS (OTP & JWT tokens)
-- ============================================

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  
  -- OTP
  otp_code VARCHAR(6),
  otp_attempts INTEGER DEFAULT 0,
  otp_expires_at TIMESTAMP,
  
  -- JWT tokens
  session_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  
  -- Device info
  device_id TEXT,
  device_type VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_sessions_phone ON auth_sessions(phone);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),
  
  -- Context
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Session info
  session_id UUID,
  device_type VARCHAR(50),
  platform VARCHAR(50),
  app_version VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_metadata ON analytics_events USING GIN(metadata);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rating (1-5 stars)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Review text
  title VARCHAR(255),
  comment TEXT,
  
  -- Categories (optional)
  categories JSONB DEFAULT '{}', -- e.g., {"cleanliness": 5, "communication": 4}
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- One review per deal per user
  UNIQUE(deal_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_deal ON reviews(deal_id);

-- ============================================
-- SUBSCRIPTIONS (Premium tiers)
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription details
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('tenant_premium', 'landlord_pro', 'landlord_business')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  
  -- Billing
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  
  -- Dates
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  
  -- Payment
  payment_method VARCHAR(50),
  payment_gateway_id TEXT, -- Razorpay/Stripe subscription ID
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tenant_profiles_updated_at BEFORE UPDATE ON tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER landlord_profiles_updated_at BEFORE UPDATE ON landlord_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER auth_sessions_updated_at BEFORE UPDATE ON auth_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON FUNCTION update_updated_at() IS 'Automatically update updated_at timestamp on row modification';
