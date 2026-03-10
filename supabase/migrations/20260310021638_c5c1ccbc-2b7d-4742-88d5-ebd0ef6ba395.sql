ALTER TABLE public.abbey_pain_config 
ADD COLUMN IF NOT EXISTS overdue_alert_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS overdue_threshold_days integer NOT NULL DEFAULT 1;