
-- Create oral_health_plans table (mirrors bowel_care_plans pattern)
CREATE TABLE public.oral_health_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  version INTEGER NOT NULL DEFAULT 1,
  plan_author TEXT,
  date_developed DATE,
  last_reviewed_date DATE,
  next_review_due DATE,
  global_assistance_level TEXT DEFAULT 'supervision',
  additional_instructions TEXT,
  dentist_instructions TEXT,
  plan_categories JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  published_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Create oral_health_plan_versions table
CREATE TABLE public.oral_health_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.oral_health_plans(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create oral_health_plan_acknowledgements table
CREATE TABLE public.oral_health_plan_acknowledgements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.oral_health_plans(id) ON DELETE CASCADE,
  plan_version INTEGER NOT NULL,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.oral_health_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_health_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_health_plan_acknowledgements ENABLE ROW LEVEL SECURITY;

-- RLS for oral_health_plans
CREATE POLICY "Staff can view oral health plans"
ON public.oral_health_plans FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert oral health plans"
ON public.oral_health_plans FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update oral health plans"
ON public.oral_health_plans FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete oral health plans"
ON public.oral_health_plans FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS for oral_health_plan_versions
CREATE POLICY "Staff can view plan versions"
ON public.oral_health_plan_versions FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert plan versions"
ON public.oral_health_plan_versions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- RLS for oral_health_plan_acknowledgements
CREATE POLICY "Staff can view acknowledgements"
ON public.oral_health_plan_acknowledgements FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can acknowledge plans"
ON public.oral_health_plan_acknowledgements FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());

-- Update trigger
CREATE TRIGGER update_oral_health_plans_updated_at
BEFORE UPDATE ON public.oral_health_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
