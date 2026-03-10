
-- Add scheduled skin check configuration columns to pressure_area_config
ALTER TABLE public.pressure_area_config 
  ADD COLUMN IF NOT EXISTS skin_checks_per_day integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS skin_check_times text[] NOT NULL DEFAULT ARRAY['08:00']::text[];

-- Add scheduled_time column to skin_check_sessions to link to schedule
ALTER TABLE public.skin_check_sessions
  ADD COLUMN IF NOT EXISTS scheduled_time text DEFAULT NULL;
