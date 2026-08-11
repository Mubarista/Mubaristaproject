-- Live chat messages for competition participants
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id TEXT,
  participant_name TEXT,
  message TEXT NOT NULL,
  read_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_competition_id ON live_chat_messages(competition_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created_at ON live_chat_messages(created_at DESC);

ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read live chat" ON live_chat_messages
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated write live chat" ON live_chat_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
