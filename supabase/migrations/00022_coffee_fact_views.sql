CREATE TABLE IF NOT EXISTS coffee_fact_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact_id UUID NOT NULL REFERENCES coffee_facts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, fact_id)
);

CREATE INDEX IF NOT EXISTS idx_coffee_fact_views_user_id ON coffee_fact_views(user_id);
CREATE INDEX IF NOT EXISTS idx_coffee_fact_views_fact_id ON coffee_fact_views(fact_id);
