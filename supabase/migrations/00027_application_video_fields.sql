-- Competition application video settings
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS application_keyword TEXT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS guide_video_url TEXT;
