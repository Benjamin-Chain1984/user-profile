-- Add "Log on Behalf Of" fields to bowel_log_entries
ALTER TABLE public.bowel_log_entries 
ADD COLUMN IF NOT EXISTS event_occurred_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

-- Add enable_log_on_behalf to bowel_care_config
ALTER TABLE public.bowel_care_config
ADD COLUMN IF NOT EXISTS enable_log_on_behalf boolean NOT NULL DEFAULT false;

-- Add resolved_reason to bowel_care_alerts for late entry resolution tracking
ALTER TABLE public.bowel_care_alerts
ADD COLUMN IF NOT EXISTS resolved_reason text;

-- Update existing entries to use entry_time as event_occurred_at if not set
UPDATE public.bowel_log_entries
SET event_occurred_at = entry_time
WHERE event_occurred_at IS NULL;