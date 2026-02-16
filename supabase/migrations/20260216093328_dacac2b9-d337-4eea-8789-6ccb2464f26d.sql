ALTER TABLE public.catheter_care_plans
ADD COLUMN IF NOT EXISTS enable_autonomic_dysreflexia BOOLEAN NOT NULL DEFAULT false;