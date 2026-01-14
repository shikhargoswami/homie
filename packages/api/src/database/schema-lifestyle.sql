-- ============================================
-- LIFESTYLE & MATCHING ENHANCEMENTS
-- Based on tech-1.md User Journey Requirements
-- ============================================

-- ============================================
-- ADD LIFESTYLE COLUMNS TO TENANT PROFILES
-- ============================================

-- Lifestyle tags for matching (tech-1.md: Section "Filter Set A")
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS lifestyle_tags JSONB DEFAULT '[]';

-- Roommate compatibility (for room_sharing search_type)
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS roommate_preferences JSONB DEFAULT '{}';

-- Work/Commute preferences
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS work_location_lat DECIMAL(10,8);

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS work_location_lng DECIMAL(11,8);

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS max_commute_minutes INTEGER DEFAULT 30;

ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS commute_mode VARCHAR(50) DEFAULT 'any' 
  CHECK (commute_mode IN ('walk_metro', 'car', 'bike', 'bus', 'wfh', 'any'));

-- Gender for roommate matching
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Occupation type
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS occupation_type VARCHAR(50)
  CHECK (occupation_type IN ('it_professional', 'student', 'healthcare', 'freelancer', 'creative', 'corporate', 'startup', 'other'));

COMMENT ON COLUMN tenant_profiles.lifestyle_tags IS 'Array of lifestyle tags: ["pet_owner_dog", "musician_guitar", "sunlight_lover", "quiet_mornings", "gym_nearby", "cook_frequently", "nightlife", "wfh_heavy"]';
COMMENT ON COLUMN tenant_profiles.roommate_preferences IS 'Roommate compatibility prefs: {sleep_schedule, cleanliness_level, social_preference, smoking, drinking, food_preference}';

-- ============================================
-- ADD LIFESTYLE DATA TO PROPERTIES
-- (Unique data points from tech-1.md)
-- ============================================

-- Noise level readings (Morning/Evening/Night dB)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS noise_levels JSONB DEFAULT '{"morning": null, "evening": null, "night": null}';

-- Sunlight hours per room
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS sunlight_hours JSONB DEFAULT '{}';

-- Pre-computed commute times to major offices
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS commute_matrix JSONB DEFAULT '{}';

-- Neighborhood POIs (cafes, metro, parks within radius)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS neighborhood_pois JSONB DEFAULT '{}';

-- Pet details
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS pet_details JSONB DEFAULT '{}';

-- Soundproofing rating (1-5)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS soundproof_rating INTEGER CHECK (soundproof_rating >= 1 AND soundproof_rating <= 5);

COMMENT ON COLUMN properties.noise_levels IS 'Noise readings: {"morning": 42, "evening": 48, "night": 35} in decibels';
COMMENT ON COLUMN properties.sunlight_hours IS 'Sunlight per room: {"living": 7, "bedroom1": 5, "bedroom2": 6}';
COMMENT ON COLUMN properties.commute_matrix IS 'Pre-computed commute: {"manyata_tech": 18, "electronic_city": 45} in minutes';
COMMENT ON COLUMN properties.neighborhood_pois IS 'Nearby POIs: {"cafes_500m": 8, "metro_distance_m": 800, "parks_1km": 2}';
COMMENT ON COLUMN properties.pet_details IS 'Pet policies: {"dogs_allowed": true, "max_weight_kg": 20, "cats_allowed": true, "garden_access": true}';

-- ============================================
-- LANDLORD TENANT PREFERENCES
-- (Two-sided matching: landlord filters tenants)
-- ============================================

ALTER TABLE landlord_profiles
ADD COLUMN IF NOT EXISTS tenant_preferences JSONB DEFAULT '{}';

COMMENT ON COLUMN landlord_profiles.tenant_preferences IS 'Landlord preferences: {preferred_occupation, age_range, gender_preference, income_multiplier, pets_allowed, smoking_allowed}';

-- ============================================
-- SUBSCRIPTION & PREMIUM FEATURES
-- ============================================

-- User subscription status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'premium', 'pro'));

ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Daily swipe tracking
CREATE TABLE IF NOT EXISTS daily_swipe_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swipe_date DATE NOT NULL DEFAULT CURRENT_DATE,
  swipe_count INTEGER DEFAULT 0,
  super_like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, swipe_date)
);

CREATE INDEX idx_daily_swipe_counts_user_date ON daily_swipe_counts(user_id, swipe_date);

COMMENT ON TABLE daily_swipe_counts IS 'Tracks daily swipes per user for free tier limits (20 swipes/day, 3 super likes/month)';

-- Active chat count tracking (free tier: 3 simultaneous chats)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- ============================================
-- ROOMMATE MATCHING (Flatmate Search)
-- ============================================

CREATE TABLE IF NOT EXISTS roommate_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Room details
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('single', 'shared', 'master')),
  room_rent INTEGER NOT NULL CHECK (room_rent >= 1000),
  room_deposit INTEGER NOT NULL DEFAULT 0,
  
  -- Available slots
  total_rooms INTEGER NOT NULL DEFAULT 1,
  available_rooms INTEGER NOT NULL DEFAULT 1,
  
  -- Current flatmates info
  current_flatmates_count INTEGER DEFAULT 0,
  current_flatmates_info JSONB DEFAULT '[]', -- Array of flatmate profiles (anonymized)
  
  -- House rules
  house_rules JSONB DEFAULT '{}',
  
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'full', 'archived')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roommate_listings_property ON roommate_listings(property_id);
CREATE INDEX idx_roommate_listings_status ON roommate_listings(status);

COMMENT ON TABLE roommate_listings IS 'Listings for single room in shared accommodations (flatmate search)';
COMMENT ON COLUMN roommate_listings.house_rules IS 'House rules: {no_smoking: true, no_parties: true, quiet_hours_start: "22:00", guests_policy: "weekends_only"}';

-- ============================================
-- LANDLORD SWIPING ON TENANTS (Two-sided matching)
-- ============================================

-- Extend matches table for two-sided swiping
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES users(id);

-- Update existing matches to include landlord_id from property
UPDATE matches m
SET landlord_id = p.landlord_id
FROM properties p
WHERE m.property_id = p.id AND m.landlord_id IS NULL;

-- Add swipe details for landlord
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS landlord_viewed_tenant BOOLEAN DEFAULT FALSE;

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS landlord_swipe_reason VARCHAR(255);

-- ============================================
-- VIEWING DEPOSITS & NO-SHOW TRACKING
-- ============================================

ALTER TABLE viewings
ADD COLUMN IF NOT EXISTS deposit_amount INTEGER DEFAULT 500;

ALTER TABLE viewings
ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(50) DEFAULT 'not_required'
  CHECK (deposit_status IN ('not_required', 'pending', 'paid', 'refunded', 'forfeited'));

ALTER TABLE viewings
ADD COLUMN IF NOT EXISTS deposit_transaction_id VARCHAR(255);

ALTER TABLE viewings
ADD COLUMN IF NOT EXISTS gps_checkin_lat DECIMAL(10,8);

ALTER TABLE viewings
ADD COLUMN IF NOT EXISTS gps_checkin_lng DECIMAL(11,8);

ALTER TABLE viewings
ADD COLUMN IF NOT EXISTS gps_checkin_time TIMESTAMP;

COMMENT ON COLUMN viewings.deposit_status IS 'Deposit flow: pending→paid→refunded (if attended) OR forfeited (if no-show)';

-- ============================================
-- CHAT ANTI-BYPASS FEATURES
-- ============================================

CREATE TABLE IF NOT EXISTS chat_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('phone_number', 'email', 'social_media', 'external_meeting')),
  detected_content TEXT,
  action_taken VARCHAR(50) NOT NULL CHECK (action_taken IN ('warned', 'blocked', 'suspended')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_violations_user ON chat_violations(user_id);

COMMENT ON TABLE chat_violations IS 'Track platform bypass attempts (sharing contact info outside platform)';

-- ============================================
-- TRIGGERS
-- ============================================

-- Update trigger for new tables
CREATE TRIGGER daily_swipe_counts_updated_at BEFORE UPDATE ON daily_swipe_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER roommate_listings_updated_at BEFORE UPDATE ON roommate_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INDEXES FOR LIFESTYLE MATCHING
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_lifestyle ON tenant_profiles USING GIN(lifestyle_tags);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_roommate ON tenant_profiles USING GIN(roommate_preferences);
CREATE INDEX IF NOT EXISTS idx_properties_noise ON properties USING GIN(noise_levels);
CREATE INDEX IF NOT EXISTS idx_properties_sunlight ON properties USING GIN(sunlight_hours);
CREATE INDEX IF NOT EXISTS idx_properties_pet_details ON properties USING GIN(pet_details);
