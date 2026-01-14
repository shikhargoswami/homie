-- ============================================
-- LANDLORD SWIPE FEATURE SCHEMA MIGRATION
-- Two-sided matching: landlords swipe on tenant profiles
-- ============================================

-- Add photo to tenant profiles (for swipe cards)
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS photo TEXT;

-- Add age for tenant display
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 18 AND age <= 100);

-- Add company name for work display (if not exists, should already be there)
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Add work location name (display name)
ALTER TABLE tenant_profiles 
ADD COLUMN IF NOT EXISTS work_location_name VARCHAR(255);

-- Update matches table to track landlord-initiated matches
-- Note: The existing schema already supports landlord swiping with:
-- - landlord_swiped BOOLEAN
-- - landlord_swipe_direction VARCHAR(10)
-- - landlord_swiped_at TIMESTAMP

-- Add match reason field to store why it's a match
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS match_reason TEXT;

-- Add landlord match highlights (computed match insights)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS match_highlights JSONB DEFAULT '[]';

-- Create index for landlord swipe queries
CREATE INDEX IF NOT EXISTS idx_matches_landlord_pending 
ON matches(property_id, landlord_swiped, tenant_swipe_direction)
WHERE landlord_swiped = false OR landlord_swiped IS NULL;

-- Create index for tenant queries (find tenants interested in landlord's properties)
CREATE INDEX IF NOT EXISTS idx_matches_tenant_interested
ON matches(property_id, tenant_swipe_direction)
WHERE tenant_swipe_direction = 'right';

COMMENT ON COLUMN tenant_profiles.photo IS 'Tenant profile photo URL';
COMMENT ON COLUMN tenant_profiles.age IS 'Tenant age for matching display';
COMMENT ON COLUMN tenant_profiles.work_location_name IS 'Display name for work location e.g., Manyata Tech Park';
COMMENT ON COLUMN matches.match_reason IS 'Human-readable match reason e.g., Works nearby, pet-friendly';
COMMENT ON COLUMN matches.match_highlights IS 'Array of match highlight strings for UI display';
