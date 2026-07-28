-- Add checkout/cart pricing settings
ALTER TABLE IF EXISTS public.site_settings
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee NUMERIC DEFAULT 0;
