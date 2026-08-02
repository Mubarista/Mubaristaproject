-- Support custom email OTP verification flow
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;
