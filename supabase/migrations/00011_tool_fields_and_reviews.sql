-- Add rich tool fields and user reviews
ALTER TABLE IF EXISTS public.tools
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS discount_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_title TEXT DEFAULT 'Free Shipping',
ADD COLUMN IF NOT EXISTS shipping_subtitle TEXT DEFAULT 'On orders over RWF 100,000',
ADD COLUMN IF NOT EXISTS warranty_title TEXT DEFAULT '2 Year Warranty',
ADD COLUMN IF NOT EXISTS warranty_subtitle TEXT DEFAULT 'Full coverage',
ADD COLUMN IF NOT EXISTS returns_title TEXT DEFAULT '30 Day Returns',
ADD COLUMN IF NOT EXISTS returns_subtitle TEXT DEFAULT 'Hassle-free returns';

CREATE TABLE IF NOT EXISTS public.tool_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating NUMERIC DEFAULT 0 NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.tool_reviews ENABLE ROW LEVEL SECURITY;
