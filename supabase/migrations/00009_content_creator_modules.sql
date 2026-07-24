-- Allow per-member module selection for content creator roles
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS allowed_modules JSONB DEFAULT '[]'::jsonb;
