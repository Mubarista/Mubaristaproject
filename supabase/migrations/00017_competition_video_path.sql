-- Track competition video storage path so uploads can be cleaned up later
ALTER TABLE IF EXISTS public.competition_applications
ADD COLUMN IF NOT EXISTS video_path TEXT;
