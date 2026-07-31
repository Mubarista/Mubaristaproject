-- Track deleted accounts so re-registration with the same email/phone is blocked for 30 days.

CREATE TABLE IF NOT EXISTS public.deleted_accounts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  email text,
  phone text,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email ON public.deleted_accounts(email);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_phone ON public.deleted_accounts(phone);

ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deleted_accounts_select_anon" ON public.deleted_accounts;
CREATE POLICY "deleted_accounts_select_anon" ON public.deleted_accounts
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "deleted_accounts_select_authenticated" ON public.deleted_accounts;
CREATE POLICY "deleted_accounts_select_authenticated" ON public.deleted_accounts
  FOR SELECT TO authenticated USING (true);
