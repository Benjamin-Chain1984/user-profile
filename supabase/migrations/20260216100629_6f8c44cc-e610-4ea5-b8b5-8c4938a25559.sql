
ALTER TABLE public.catheter_care_plans
ADD COLUMN IF NOT EXISTS flush_custom_interval TEXT;
