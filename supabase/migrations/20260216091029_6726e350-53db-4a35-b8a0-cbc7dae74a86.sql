
-- Catheter Care Plans table
CREATE TABLE public.catheter_care_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Plan overview
  plan_author TEXT,
  date_developed DATE,
  last_reviewed_date DATE,
  next_review_due DATE,
  prescribing_clinician TEXT,
  
  -- A. Catheter details
  catheter_type TEXT,
  catheter_size_fr TEXT,
  balloon_size_ml TEXT,
  insertion_date DATE,
  change_interval TEXT,
  responsible_clinician TEXT,
  
  -- B. Daily care instructions (JSON checklists)
  hygiene_checklist JSONB DEFAULT '[]'::jsonb,
  bag_management_checklist JSONB DEFAULT '[]'::jsonb,
  drainage_monitoring_checklist JSONB DEFAULT '[]'::jsonb,
  fluid_advice_checklist JSONB DEFAULT '[]'::jsonb,
  
  -- C. Bag change schedule
  leg_bag_change_frequency TEXT,
  night_bag_change_frequency TEXT,
  full_system_change_protocol TEXT,
  
  -- D. Escalation instructions
  no_urine_hours_threshold INTEGER DEFAULT 4,
  escalation_instructions JSONB DEFAULT '[]'::jsonb,
  
  -- E. Additional instructions
  additional_instructions TEXT,
  
  -- Publishing & audit
  published_at TIMESTAMPTZ,
  published_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.catheter_care_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view catheter care plans" ON public.catheter_care_plans
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert catheter care plans" ON public.catheter_care_plans
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update catheter care plans" ON public.catheter_care_plans
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_catheter_care_plans_updated_at
  BEFORE UPDATE ON public.catheter_care_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Catheter Care Plan Versions
CREATE TABLE public.catheter_care_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.catheter_care_plans(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.catheter_care_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view catheter plan versions" ON public.catheter_care_plan_versions
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert catheter plan versions" ON public.catheter_care_plan_versions
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Catheter Care Plan Acknowledgements
CREATE TABLE public.catheter_care_plan_acknowledgements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.catheter_care_plans(id) ON DELETE CASCADE,
  plan_version INTEGER NOT NULL,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catheter_care_plan_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view catheter plan acknowledgements" ON public.catheter_care_plan_acknowledgements
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert own catheter plan acknowledgement" ON public.catheter_care_plan_acknowledgements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
