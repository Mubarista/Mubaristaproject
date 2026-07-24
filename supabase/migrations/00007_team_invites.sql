-- Add invitation fields for team member short access links
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invite_url TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

-- Unique index to avoid token collisions
CREATE UNIQUE INDEX IF NOT EXISTS team_members_invite_token_idx ON team_members(invite_token) WHERE invite_token IS NOT NULL;
