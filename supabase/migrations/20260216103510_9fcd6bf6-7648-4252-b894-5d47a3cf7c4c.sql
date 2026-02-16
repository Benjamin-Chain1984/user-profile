
-- Add plan author contact fields
ALTER TABLE public.catheter_care_plans
  ADD COLUMN IF NOT EXISTS plan_author_phone TEXT,
  ADD COLUMN IF NOT EXISTS plan_author_email TEXT;
