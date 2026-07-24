-- Add images column to learning_content table for storing multiple images with captions
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add content_type column if not exists (for text, video, image)
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';

-- Add media_url column if not exists
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT '';

-- Add text_content column if not exists
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS text_content TEXT DEFAULT '';

-- Add active column if not exists
ALTER TABLE learning_content ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;