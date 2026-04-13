
-- Bowel Care Competency Config
CREATE TABLE public.bowel_competency_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  pass_threshold_percent INTEGER NOT NULL DEFAULT 80,
  validity_months INTEGER NOT NULL DEFAULT 12,
  expiry_warning_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID DEFAULT auth.uid(),
  UNIQUE(client_id)
);

ALTER TABLE public.bowel_competency_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view competency config"
ON public.bowel_competency_config FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert competency config"
ON public.bowel_competency_config FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update competency config"
ON public.bowel_competency_config FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_bowel_competency_config_updated_at
BEFORE UPDATE ON public.bowel_competency_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Bowel Care Competency Attempts
CREATE TABLE public.bowel_competency_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  invalidated BOOLEAN NOT NULL DEFAULT false,
  invalidated_at TIMESTAMP WITH TIME ZONE,
  invalidated_reason TEXT,
  answers_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

ALTER TABLE public.bowel_competency_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view competency attempts"
ON public.bowel_competency_attempts FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create own attempts"
ON public.bowel_competency_attempts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = staff_user_id AND public.is_staff(auth.uid()));

CREATE POLICY "Admins can update attempts"
ON public.bowel_competency_attempts FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_bowel_competency_attempts_staff ON public.bowel_competency_attempts(staff_user_id);
CREATE INDEX idx_bowel_competency_attempts_client ON public.bowel_competency_attempts(client_id);
CREATE INDEX idx_bowel_competency_attempts_valid ON public.bowel_competency_attempts(valid_until);
