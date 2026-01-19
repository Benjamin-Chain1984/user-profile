-- Create phone_otps table for storing verification codes
CREATE TABLE public.phone_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL UNIQUE,
    otp_hash TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions)
CREATE POLICY "Service role can manage phone_otps"
    ON public.phone_otps
    FOR ALL
    USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Add index for faster lookups
CREATE INDEX idx_phone_otps_phone ON public.phone_otps(phone);
CREATE INDEX idx_phone_otps_expires ON public.phone_otps(expires_at);

-- Add PHONE_VERIFIED to audit actions (already exists as text, no enum change needed)