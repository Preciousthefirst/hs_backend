-- ============================================================================
-- Check Users Table Structure
-- Run this in phpMyAdmin to verify your users table has the required columns
-- ============================================================================

-- Check if users table exists and show its structure
DESCRIBE users;

-- Check if 'name' column exists
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'name';

-- Check if 'created_at' column exists
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'created_at';

-- View sample user data to see what's actually stored
SELECT id, name, email, created_at, role, points
FROM users
LIMIT 5;

-- ============================================================================
-- If 'name' column is missing, run this:
-- ============================================================================
-- ALTER TABLE users ADD COLUMN name VARCHAR(255) AFTER id;

-- ============================================================================
-- If 'created_at' column is missing, run this:
-- ============================================================================
-- ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- If users don't have names, you can update them from email:
-- ============================================================================
-- UPDATE users 
-- SET name = SUBSTRING_INDEX(email, '@', 1)
-- WHERE name IS NULL OR name = '';

