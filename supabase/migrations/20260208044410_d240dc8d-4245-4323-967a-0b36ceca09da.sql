
-- Add new config fields for excessive sleep thresholds
ALTER TABLE public.sleep_config
  ADD COLUMN IF NOT EXISTS max_sleep_threshold_hours numeric DEFAULT 12,
  ADD COLUMN IF NOT EXISTS consecutive_excessive_sleep_trigger integer DEFAULT 2;

-- Add awakening_events JSONB column to sleep_entries
-- This replaces the flat number_of_awakenings + awake_period_length columns
ALTER TABLE public.sleep_entries
  ADD COLUMN IF NOT EXISTS awakening_events jsonb DEFAULT '[]'::jsonb;

-- Keep old columns for backward compatibility but they'll be derived from awakening_events going forward
