-- Add email column to judge_credentials table
ALTER TABLE judge_credentials ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';