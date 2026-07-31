-- Subscription expiry, auto-renew and cancellation support

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS subscription_expiry timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_duration text,
  ADD COLUMN IF NOT EXISTS subscription_auto_renew boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_next_renewal timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_renewal_failures integer DEFAULT 0;
