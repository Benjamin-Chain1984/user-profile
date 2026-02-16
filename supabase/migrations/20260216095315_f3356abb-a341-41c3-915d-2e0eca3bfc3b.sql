
-- Part A: Add flush procedure config fields to catheter_care_plans
ALTER TABLE public.catheter_care_plans
ADD COLUMN IF NOT EXISTS flush_prescribed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS flush_solution_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flush_solution_other TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flush_volume_ml INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flush_frequency TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flush_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flush_performer TEXT DEFAULT NULL;

-- Part D: Add enhanced logging fields to catheter_flush_logs
ALTER TABLE public.catheter_flush_logs
ADD COLUMN IF NOT EXISTS return_volume_ml INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flush_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS urine_appearance TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flow_after_flush TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS person_response TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS training_confirmed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_required BOOLEAN NOT NULL DEFAULT false;
