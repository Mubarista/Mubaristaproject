-- Competition application fields required by the apply/nominate flows
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS over18 BOOLEAN DEFAULT false;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS video_path TEXT DEFAULT '';
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMPTZ;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS nominated_at TIMESTAMPTZ;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS access_link TEXT;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS access_link_expires_at TIMESTAMPTZ;
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- Competition results scoring fields
ALTER TABLE competition_results ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE competition_results ADD COLUMN IF NOT EXISTS vote_points NUMERIC DEFAULT 0;
ALTER TABLE competition_results ADD COLUMN IF NOT EXISTS judge_score NUMERIC DEFAULT 0;

-- Link winners to a competition
ALTER TABLE winners ADD COLUMN IF NOT EXISTS competition_id UUID;

-- Public voting table: one vote per registered user per application
CREATE TABLE IF NOT EXISTS competition_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id TEXT NOT NULL,
  application_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  points NUMERIC DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (application_id, voter_id)
);

-- Index for leaderboard lookups
CREATE INDEX IF NOT EXISTS idx_competition_votes_competition_id ON competition_votes(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_votes_application_id ON competition_votes(application_id);
CREATE INDEX IF NOT EXISTS idx_competition_results_competition_id ON competition_results(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_results_application_id ON competition_results(application_id);
