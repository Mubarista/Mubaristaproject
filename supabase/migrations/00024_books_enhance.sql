-- Ensure book categories table exists
CREATE TABLE IF NOT EXISTS book_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT '';
ALTER TABLE books ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS order_column INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES book_categories(id);
