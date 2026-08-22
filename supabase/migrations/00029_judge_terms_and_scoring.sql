-- Add judge terms acceptance tracking
ALTER TABLE judge_credentials ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add scoring sequence/order tracking to competition_applications
ALTER TABLE competition_applications ADD COLUMN IF NOT EXISTS scoring_order INTEGER DEFAULT 0;

-- Add index for efficient scoring order lookups
CREATE INDEX IF NOT EXISTS idx_competition_applications_scoring_order ON competition_applications(competition_id, scoring_order);

-- Add index for judge scores by application
CREATE INDEX IF NOT EXISTS idx_judge_scores_application_id ON judge_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_judge_application ON judge_scores(judge_id, application_id);