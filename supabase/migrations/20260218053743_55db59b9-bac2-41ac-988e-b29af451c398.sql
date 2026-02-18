
-- Add observation scheduling and notification fields to iddsi_config
ALTER TABLE public.iddsi_config
  ADD COLUMN IF NOT EXISTS enable_observations boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observation_frequency text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS amber_recipient_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS red_recipient_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS enable_notifications boolean NOT NULL DEFAULT false;
