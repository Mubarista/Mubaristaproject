-- Add status column to team_members for suspend/ban support
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Backfill existing team members based on is_active
UPDATE team_members SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;
