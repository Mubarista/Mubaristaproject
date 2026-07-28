-- Add stock/quantity tracking for tools
ALTER TABLE IF EXISTS public.tools
ADD COLUMN IF NOT EXISTS stock INTEGER;
