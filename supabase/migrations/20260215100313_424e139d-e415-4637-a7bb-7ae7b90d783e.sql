
-- Epilepsy & Seizure Monitoring Module Tables

-- 1. Epilepsy Config
CREATE TABLE public.epilepsy_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  enable_seizure_monitoring BOOLEAN NOT NULL DEFAULT true,
  expected_seizure_frequency TEXT NOT NULL DEFAULT 'unknown',
  typical_seizure_duration_minutes NUMERIC NULL,
  rescue_medication_prescribed BOOLEAN NOT NULL DEFAULT false,
  rescue_medication_name TEXT NULL,
  rescue_medication_dose TEXT NULL,
  rescue_medication_route TEXT NULL,
  rescue_medication_when TEXT NULL,
  call_000_after_minutes NUMERIC NOT NULL DEFAULT 5,
  cluster_seizure_count INTEGER NOT NULL DEFAULT 2,
  cluster_seizure_hours INTEGER NOT NULL DEFAULT 24,
  max_seizures_24h INTEGER NOT NULL DEFAULT 3,
  duration_threshold_minutes NUMERIC NOT NULL DEFAULT 5,
  escalation_recipients TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  UNIQUE(client_id)
);

ALTER TABLE public.epilepsy_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view epilepsy config" ON public.epilepsy_config
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage epilepsy config" ON public.epilepsy_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_epilepsy_config_updated_at
  BEFORE UPDATE ON public.epilepsy_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seizure Events
CREATE TABLE public.seizure_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes NUMERIC NOT NULL DEFAULT 0,
  duration_seconds NUMERIC NOT NULL DEFAULT 0,
  seizure_category TEXT NOT NULL DEFAULT 'unknown',
  seizure_type TEXT NOT NULL DEFAULT 'unknown',
  triggers TEXT[] NOT NULL DEFAULT '{}',
  trigger_other TEXT NULL,
  recovery TEXT[] NOT NULL DEFAULT '{}',
  recovery_notes TEXT NULL,
  observation_type TEXT NOT NULL DEFAULT 'observed',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  edited_at TIMESTAMPTZ NULL,
  edited_by UUID NULL,
  edit_reason TEXT NULL
);

ALTER TABLE public.seizure_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view seizure events" ON public.seizure_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert seizure events" ON public.seizure_events
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update seizure events" ON public.seizure_events
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 3. Seizure Actions (Rescue medication administrations & emergency actions)
CREATE TABLE public.seizure_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  seizure_event_id UUID REFERENCES public.seizure_events(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'rescue_medication',
  medication_name TEXT NULL,
  medication_dose TEXT NULL,
  medication_route TEXT NULL,
  time_administered TIMESTAMPTZ NULL,
  witness_name TEXT NULL,
  dose_matches_plan BOOLEAN NULL,
  dose_change_reason TEXT NULL,
  ambulance_called BOOLEAN NOT NULL DEFAULT false,
  ambulance_time_called TIMESTAMPTZ NULL,
  ambulance_outcome TEXT NULL,
  total_seizure_duration_minutes NUMERIC NULL,
  total_recovery_time_minutes NUMERIC NULL,
  injuries_noted TEXT NULL,
  escalation_completed BOOLEAN NOT NULL DEFAULT false,
  post_event_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  edited_at TIMESTAMPTZ NULL,
  edited_by UUID NULL,
  edit_reason TEXT NULL
);

ALTER TABLE public.seizure_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view seizure actions" ON public.seizure_actions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert seizure actions" ON public.seizure_actions
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update seizure actions" ON public.seizure_actions
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 4. Epilepsy Alerts
CREATE TABLE public.epilepsy_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'amber',
  message TEXT NOT NULL,
  metadata JSONB NULL,
  acknowledged_at TIMESTAMPTZ NULL,
  acknowledged_by UUID NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL,
  resolved_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

ALTER TABLE public.epilepsy_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view epilepsy alerts" ON public.epilepsy_alerts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert epilepsy alerts" ON public.epilepsy_alerts
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update epilepsy alerts" ON public.epilepsy_alerts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 5. Epilepsy Escalation Records
CREATE TABLE public.epilepsy_escalation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.epilepsy_alerts(id) ON DELETE SET NULL,
  seizure_event_id UUID REFERENCES public.seizure_events(id) ON DELETE SET NULL,
  escalation_reason TEXT NOT NULL,
  contacted_person TEXT NOT NULL,
  contact_role TEXT NULL,
  contact_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  advice_received TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  edited_at TIMESTAMPTZ NULL,
  edited_by UUID NULL,
  edit_reason TEXT NULL
);

ALTER TABLE public.epilepsy_escalation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view epilepsy escalations" ON public.epilepsy_escalation_records
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert epilepsy escalations" ON public.epilepsy_escalation_records
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update epilepsy escalations" ON public.epilepsy_escalation_records
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- Enable realtime for seizure events
ALTER PUBLICATION supabase_realtime ADD TABLE public.seizure_events;
