
-- PAINAD assessments table
CREATE TABLE public.painad_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  q1_breathing INTEGER NOT NULL,
  q2_negative_vocalization INTEGER NOT NULL,
  q3_facial_expression INTEGER NOT NULL,
  q4_body_language INTEGER NOT NULL,
  q5_consolability INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  severity TEXT NOT NULL,
  pain_type TEXT NOT NULL,
  trigger_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.painad_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view painad assessments"
  ON public.painad_assessments FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert painad assessments"
  ON public.painad_assessments FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update painad assessments"
  ON public.painad_assessments FOR UPDATE
  USING (public.is_staff(auth.uid()));

-- Add tool preference columns to abbey_pain_config
ALTER TABLE public.abbey_pain_config
  ADD COLUMN IF NOT EXISTS enabled_tools TEXT[] NOT NULL DEFAULT ARRAY['abbey', 'painad'],
  ADD COLUMN IF NOT EXISTS default_tool TEXT NOT NULL DEFAULT 'abbey';
