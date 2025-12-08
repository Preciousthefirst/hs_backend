-- ============================================================================
-- Add Google Places API support columns to businesses table
-- Run this in phpMyAdmin if latitude/longitude columns don't exist
-- ============================================================================

USE hangout_spots;

-- Add latitude and longitude columns for GPS coordinates (from Google Places)
-- These columns are needed for GPS check-in verification
-- Note: If these columns already exist, you'll get an error, which is fine - just ignore it

ALTER TABLE businesses 
ADD COLUMN latitude DECIMAL(10, 8) NULL COMMENT 'Latitude from Google Places or geocoding',
ADD COLUMN longitude DECIMAL(11, 8) NULL COMMENT 'Longitude from Google Places or geocoding';

-- Optional: Add place_id column for better business matching (future enhancement)
-- This allows us to match businesses by Google Places ID instead of just name+address
-- Uncomment the line below if you want to add this (not required for current functionality)

-- ALTER TABLE businesses ADD COLUMN place_id VARCHAR(255) NULL UNIQUE COMMENT 'Google Places ID';

-- Verify the columns were added
DESCRIBE businesses;

