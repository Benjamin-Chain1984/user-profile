
-- Pressure Area Prevention Module Tables

-- 1. Pressure Relief Plans (versioned, source of truth)
CREATE TABLE public.pressure_relief_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  plan_author TEXT,
  plan_author_email TEXT,
  plan_author_phone TEXT,
  date_developed TEXT,
  last_reviewed_date TEXT,
  next_review_due TEXT,
  schedule_type TEXT DEFAULT 'interval', -- 'fixed', 'interval', 'mixed', 'as_required'
  day_schedule_start TEXT DEFAULT '06:00',
  day_schedule_end TEXT DEFAULT '22:00',
  night_schedule_start TEXT,
  night_schedule_end TEXT,
  interval_minutes INTEGER DEFAULT 120,
  rotation_sequence JSONB DEFAULT '[]'::jsonb,
  high_risk_areas TEXT[] DEFAULT ARRAY['sacrum_coccyx', 'heels', 'hips']::TEXT[],
  escalation_rules JSONB DEFAULT '{}'::jsonb,
  overdue_amber_minutes INTEGER DEFAULT 30,
  overdue_red_minutes INTEGER DEFAULT 60,
  additional_instructions TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.pressure_relief_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view pressure relief plans" ON public.pressure_relief_plans FOR SELECT USING (true);
CREATE POLICY "Staff can insert pressure relief plans" ON public.pressure_relief_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update pressure relief plans" ON public.pressure_relief_plans FOR UPDATE USING (true);

-- 2. Plan Versions
CREATE TABLE public.pressure_relief_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.pressure_relief_plans(id),
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.pressure_relief_plan_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view plan versions" ON public.pressure_relief_plan_versions FOR SELECT USING (true);
CREATE POLICY "Staff can insert plan versions" ON public.pressure_relief_plan_versions FOR INSERT WITH CHECK (true);

-- 3. Plan Acknowledgements
CREATE TABLE public.pressure_relief_plan_acknowledgements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.pressure_relief_plans(id),
  plan_version INTEGER NOT NULL,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.pressure_relief_plan_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view acks" ON public.pressure_relief_plan_acknowledgements FOR SELECT USING (true);
CREATE POLICY "Staff can insert acks" ON public.pressure_relief_plan_acknowledgements FOR INSERT WITH CHECK (true);

-- 4. Pressure Relief Events (logging against plan)
CREATE TABLE public.pressure_relief_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  position_completed TEXT NOT NULL,
  position_recommended TEXT,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issues TEXT[] DEFAULT '{}'::TEXT[],
  issue_details TEXT,
  escalation_required BOOLEAN DEFAULT false,
  escalation_contact TEXT,
  escalation_advice TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.pressure_relief_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view events" ON public.pressure_relief_events FOR SELECT USING (true);
CREATE POLICY "Staff can insert events" ON public.pressure_relief_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update events" ON public.pressure_relief_events FOR UPDATE USING (true);

-- 5. Skin Check Sessions
CREATE TABLE public.skin_check_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  overall_status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'amber', 'red'
  notes TEXT,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.skin_check_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view skin checks" ON public.skin_check_sessions FOR SELECT USING (true);
CREATE POLICY "Staff can insert skin checks" ON public.skin_check_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update skin checks" ON public.skin_check_sessions FOR UPDATE USING (true);

-- 6. Skin Finding Markers (body map coordinates)
CREATE TABLE public.skin_finding_markers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.skin_check_sessions(id) ON DELETE CASCADE,
  location TEXT NOT NULL, -- e.g. 'sacrum', 'left_heel'
  finding_type TEXT NOT NULL, -- 'blanching_redness', 'non_blanching_redness', 'blister', 'broken_skin', 'pain', 'discharge', 'mild_redness'
  severity TEXT NOT NULL DEFAULT 'amber', -- 'amber' or 'red'
  x_percent NUMERIC, -- position on body map 0-100
  y_percent NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skin_finding_markers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view markers" ON public.skin_finding_markers FOR SELECT USING (true);
CREATE POLICY "Staff can insert markers" ON public.skin_finding_markers FOR INSERT WITH CHECK (true);

-- 7. Pressure Area Config
CREATE TABLE public.pressure_area_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) UNIQUE,
  enable_compliance_scoring BOOLEAN DEFAULT true,
  skin_check_frequency_days INTEGER DEFAULT 7,
  escalation_recipients TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.pressure_area_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view config" ON public.pressure_area_config FOR SELECT USING (true);
CREATE POLICY "Staff can insert config" ON public.pressure_area_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update config" ON public.pressure_area_config FOR UPDATE USING (true);

-- 8. Pressure Area Alerts
CREATE TABLE public.pressure_area_alerts (
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

ALTER TABLE public.pressure_area_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view alerts" ON public.pressure_area_alerts FOR SELECT USING (true);
CREATE POLICY "Staff can insert alerts" ON public.pressure_area_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update alerts" ON public.pressure_area_alerts FOR UPDATE USING (true);

-- 9. Pressure Area Escalation Records
CREATE TABLE public.pressure_area_escalation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  alert_id UUID REFERENCES public.pressure_area_alerts(id),
  escalation_reason TEXT NOT NULL,
  contacted_person TEXT NOT NULL,
  contact_role TEXT,
  contact_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  advice_received TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.pressure_area_escalation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view escalations" ON public.pressure_area_escalation_records FOR SELECT USING (true);
CREATE POLICY "Staff can insert escalations" ON public.pressure_area_escalation_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update escalations" ON public.pressure_area_escalation_records FOR UPDATE USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pressure_relief_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.skin_check_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pressure_area_alerts;
