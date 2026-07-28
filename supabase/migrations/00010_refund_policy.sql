-- Add refund policy content to site settings
ALTER TABLE IF EXISTS site_settings ADD COLUMN IF NOT EXISTS refund_content TEXT DEFAULT '';
