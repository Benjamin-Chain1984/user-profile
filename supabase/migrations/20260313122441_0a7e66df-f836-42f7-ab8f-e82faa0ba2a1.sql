
-- Add MFA tracking fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_mfa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_mfa_due_at timestamptz;

-- Create trusted_devices table
CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  trusted_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  UNIQUE(user_id, device_id)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trusted devices"
  ON public.trusted_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can register own trusted devices"
  ON public.trusted_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trusted devices"
  ON public.trusted_devices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all trusted devices"
  ON public.trusted_devices FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create QR access logs table
CREATE TABLE public.qr_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  device_id text,
  access_method text NOT NULL DEFAULT 'otp',
  accessed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access logs"
  ON public.qr_access_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own access logs"
  ON public.qr_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all access logs"
  ON public.qr_access_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
