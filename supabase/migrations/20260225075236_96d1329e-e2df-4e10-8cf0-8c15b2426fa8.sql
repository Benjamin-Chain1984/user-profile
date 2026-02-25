
-- Add Amber threshold fields and unit selectors for epilepsy escalation
ALTER TABLE public.epilepsy_config
  ADD COLUMN IF NOT EXISTS amber_seizure_count integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS amber_seizure_window integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS amber_seizure_window_unit text NOT NULL DEFAULT 'hours',
  ADD COLUMN IF NOT EXISTS red_seizure_count integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS red_seizure_window integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS red_seizure_window_unit text NOT NULL DEFAULT 'hours';
