-- Ensure one result row per application
CREATE UNIQUE INDEX IF NOT EXISTS idx_competition_results_application_unique
ON competition_results (application_id);
