
-- Digital Bowel Care Plan tables

-- 1. Main plan table
CREATE TABLE public.bowel_care_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- A1: Plan Overview
  plan_author TEXT,
  date_developed DATE,
  last_reviewed_date DATE,
  next_review_due DATE,
  participant_involvement_confirmed BOOLEAN DEFAULT false,
  consent_to_share BOOLEAN DEFAULT false,
  
  -- A2: Participant Profile & Baseline
  normal_stool_bristol_types INTEGER[] DEFAULT '{3,4}',
  typical_bowel_frequency TEXT,
  known_bowel_patterns TEXT,
  dietary_considerations TEXT,
  fluid_intake_expectations TEXT,
  mobility_considerations TEXT,
  communication_preferences TEXT,
  
  -- A3: Bowel Support Requirements
  toileting_assistance TEXT DEFAULT 'independent' CHECK (toileting_assistance IN ('independent', 'prompting', 'physical_assistance', 'full_support')),
  positioning_requirements TEXT,
  equipment_required TEXT,
  continence_support BOOLEAN DEFAULT false,
  
  -- A4: Risk Monitoring (JSONB array of risk entries)
  risk_entries JSONB DEFAULT '[]'::jsonb,
  
  -- A4: PRN Escalation Builder (JSONB array)
  prn_escalation_steps JSONB DEFAULT '[]'::jsonb,
  
  -- A5: Incident & Emergency Response (JSONB)
  emergency_responses JSONB DEFAULT '[]'::jsonb,
  
  -- A6: Equipment & Consumables
  equipment_checklist JSONB DEFAULT '{"gloves":false,"lubricant":false,"enema":false,"suppositories":false,"continence_pads":false,"hoist":false,"commode":false,"other":""}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id)
);

-- 2. Version history
CREATE TABLE public.bowel_care_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bowel_care_plans(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Staff acknowledgements
CREATE TABLE public.bowel_care_plan_acknowledgements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bowel_care_plans(id) ON DELETE CASCADE,
  plan_version INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, plan_version, user_id)
);

-- Enable RLS
ALTER TABLE public.bowel_care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_care_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_care_plan_acknowledgements ENABLE ROW LEVEL SECURITY;

-- RLS: Plans - staff can view, admins can edit
CREATE POLICY "Staff can view bowel care plans"
  ON public.bowel_care_plans FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert bowel care plans"
  ON public.bowel_care_plans FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bowel care plans"
  ON public.bowel_care_plans FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS: Versions
CREATE POLICY "Staff can view plan versions"
  ON public.bowel_care_plan_versions FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert plan versions"
  ON public.bowel_care_plan_versions FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS: Acknowledgements
CREATE POLICY "Staff can view acknowledgements"
  ON public.bowel_care_plan_acknowledgements FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can acknowledge plans"
  ON public.bowel_care_plan_acknowledgements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bowel_care_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bowel_care_plan_acknowledgements;

-- Auto update timestamp
CREATE TRIGGER update_bowel_care_plans_updated_at
  BEFORE UPDATE ON public.bowel_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
