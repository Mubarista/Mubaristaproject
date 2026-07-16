-- Add avatar column to users table for profile photos
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;