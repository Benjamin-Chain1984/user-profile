
-- Add recorded_on_behalf_of columns to all clinical tables missing them

ALTER TABLE public.abbey_pain_assessments
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.catheter_bag_change_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.catheter_flush_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.catheter_stoma_checks
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.continence_consumables_checks
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.enteral_feed_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.enteral_flush_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.enteral_medication_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.enteral_stoma_checks
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.enteral_tube_change_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.hydration_symptom_checks
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.mealtime_observations
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.oral_health_assessments
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.oral_health_task_logs
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.pain_action_records
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.painad_assessments
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.pressure_relief_events
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.seizure_events
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;

ALTER TABLE public.skin_check_sessions
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_name text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_role text,
  ADD COLUMN IF NOT EXISTS recorded_on_behalf_of_reason text;
