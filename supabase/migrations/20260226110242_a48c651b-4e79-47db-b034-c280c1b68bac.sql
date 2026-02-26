-- Add skin check schedule JSONB column to pressure_relief_plans
-- Stores per-high-risk-area skin check configuration:
-- { "sacrum_coccyx": { "enabled": true, "frequency": "daily" }, ... }
-- frequency values: "daily" (1/day), "twice_daily" (2/day), "three_times_daily" (3/day), "custom"
-- custom adds "custom_times_per_day": N
ALTER TABLE public.pressure_relief_plans
ADD COLUMN skin_check_schedule jsonb DEFAULT '{}'::jsonb;