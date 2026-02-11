
-- Oral Health Module Tables

-- 1) oral_health_config - Module-level settings
CREATE TABLE public.oral_health_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  enable_compliance_monitoring BOOLEAN NOT NULL DEFAULT false,
  assessment_frequency TEXT NOT NULL DEFAULT 'weekly',
  consecutive_missed_tasks_alert INTEGER NOT NULL DEFAULT 2,
  escalation_recipients TEXT[] NOT NULL DEFAULT '{"supervisor","nurse"}',
  global_assistance_level TEXT NOT NULL DEFAULT 'supervision',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(client_id)
);

-- 2) oral_health_plan_categories - Practitioner care plan per category
CREATE TABLE public.oral_health_plan_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  category TEXT NOT NULL,
  am_required BOOLEAN NOT NULL DEFAULT true,
  pm_required BOOLEAN NOT NULL DEFAULT true,
  products TEXT,
  cleaning_method TEXT,
  additional_instructions TEXT,
  assistance_level TEXT,
  dentist_instructions TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- 3) oral_health_task_logs - Daily AM/PM compliance logging
CREATE TABLE public.oral_health_task_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period TEXT NOT NULL CHECK (period IN ('am', 'pm')),
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

-- 4) oral_health_assessments - Screening assessment records
CREATE TABLE public.oral_health_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  assessment_trigger TEXT NOT NULL DEFAULT 'scheduled',
  lips TEXT NOT NULL DEFAULT 'healthy',
  tongue TEXT NOT NULL DEFAULT 'healthy',
  roof_of_mouth TEXT NOT NULL DEFAULT 'healthy',
  gums TEXT NOT NULL DEFAULT 'healthy',
  teeth TEXT NOT NULL DEFAULT 'healthy',
  dentures TEXT,
  breath TEXT NOT NULL DEFAULT 'healthy',
  cleanliness TEXT NOT NULL DEFAULT 'healthy',
  dental_pain TEXT NOT NULL DEFAULT 'healthy',
  overall_status TEXT NOT NULL DEFAULT 'healthy',
  action_taken TEXT,
  action_notes TEXT,
  escalation_contact TEXT,
  mouth_annotations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

-- 5) oral_health_alerts
CREATE TABLE public.oral_health_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'amber',
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolved_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.oral_health_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_health_plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_health_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Staff can read/write
CREATE POLICY "Staff can view oral health config" ON public.oral_health_config FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin can manage oral health config" ON public.oral_health_config FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view plan categories" ON public.oral_health_plan_categories FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin can manage plan categories" ON public.oral_health_plan_categories FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view task logs" ON public.oral_health_task_logs FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert task logs" ON public.oral_health_task_logs FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admin can update task logs" ON public.oral_health_task_logs FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view assessments" ON public.oral_health_assessments FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert assessments" ON public.oral_health_assessments FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admin can update assessments" ON public.oral_health_assessments FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view oral health alerts" ON public.oral_health_alerts FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert oral health alerts" ON public.oral_health_alerts FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update oral health alerts" ON public.oral_health_alerts FOR UPDATE USING (public.is_staff(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.oral_health_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.oral_health_task_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.oral_health_alerts;

-- Triggers for updated_at
CREATE TRIGGER update_oral_health_config_updated_at BEFORE UPDATE ON public.oral_health_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_oral_health_plan_categories_updated_at BEFORE UPDATE ON public.oral_health_plan_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
