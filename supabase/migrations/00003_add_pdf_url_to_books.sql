-- Add pdf_url column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT '';

-- Update RLS policies to include the new column
-- (Existing policies already cover all columns)
