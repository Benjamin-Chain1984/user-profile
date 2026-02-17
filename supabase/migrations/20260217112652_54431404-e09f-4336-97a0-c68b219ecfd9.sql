
-- Add completed_by_name column to pressure_relief_events
ALTER TABLE public.pressure_relief_events
ADD COLUMN completed_by_name text;
