-- ============================================
-- Migration: Add Property Wizard Fields
-- Date: 2026-01-15
-- Description: Adds new columns to properties table
--              to support the multi-step property wizard
-- ============================================

-- Add title column for property listing title
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add description column for property description
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add VR tour requested flag
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS vr_tour_requested BOOLEAN DEFAULT FALSE;

-- Make latitude/longitude nullable (location is optional in wizard)
ALTER TABLE properties 
ALTER COLUMN latitude DROP NOT NULL;

ALTER TABLE properties 
ALTER COLUMN longitude DROP NOT NULL;

-- Update property_type check constraint to include 'independent_house'
-- First drop the existing constraint
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Add new constraint with independent_house
ALTER TABLE properties 
ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN ('apartment', 'house', 'villa', 'studio', 'pg', 'independent_house'));

-- Update furnishing check constraint to match wizard values
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_furnishing_check;

ALTER TABLE properties 
ADD CONSTRAINT properties_furnishing_check 
CHECK (furnishing IN ('unfurnished', 'semi-furnished', 'fully-furnished', 'semi_furnished', 'fully_furnished'));

-- Add index on title for search
CREATE INDEX IF NOT EXISTS idx_properties_title ON properties(title);

-- Add index on description for full-text search (future feature)
CREATE INDEX IF NOT EXISTS idx_properties_description ON properties USING GIN(to_tsvector('english', COALESCE(description, '')));

-- Comment on new columns
COMMENT ON COLUMN properties.title IS 'Display title for the property listing (e.g., "Spacious 2BHK in Koramangala")';
COMMENT ON COLUMN properties.description IS 'Detailed description of the property written by landlord';
COMMENT ON COLUMN properties.vr_tour_requested IS 'Whether landlord has requested a VR tour photoshoot';

-- ============================================
-- Rollback commands (for reference):
-- ALTER TABLE properties DROP COLUMN IF EXISTS title;
-- ALTER TABLE properties DROP COLUMN IF EXISTS description;
-- ALTER TABLE properties DROP COLUMN IF EXISTS vr_tour_requested;
-- ALTER TABLE properties ALTER COLUMN latitude SET NOT NULL;
-- ALTER TABLE properties ALTER COLUMN longitude SET NOT NULL;
-- ============================================
