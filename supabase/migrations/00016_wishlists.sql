-- Wishlists table for books and tools
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'tool')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_id, item_type)
);

-- Allow users to manage only their own wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wishlists"
  ON public.wishlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own wishlists"
  ON public.wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own wishlists"
  ON public.wishlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant access to public (auth RLS controls per-user access)
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
