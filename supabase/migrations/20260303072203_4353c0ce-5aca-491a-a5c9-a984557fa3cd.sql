
-- ═══════════════════════════════════════════════════════════════
-- Enteral Nutrition Module - Database Schema
-- ═══════════════════════════════════════════════════════════════

-- 1) Enteral Configuration (admin-only)
CREATE TABLE public.enteral_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  nil_by_mouth BOOLEAN NOT NULL DEFAULT false,
  -- Tube Details
  tube_type TEXT,
  tube_size_fr TEXT,
  tube_inserted_date DATE,
  next_tube_change_due DATE,
  tube_change_interval_days INTEGER,
  tube_change_alert_lead_days INTEGER NOT NULL DEFAULT 7,
  tube_change_overdue_days INTEGER NOT NULL DEFAULT 1,
  -- Formula & Feeding
  formula_name TEXT,
  formula_custom_name TEXT,
  feeding_type TEXT, -- 'continuous', 'bolus', 'gravity'
  prescribed_volume_ml INTEGER,
  -- Water Flush
  flush_before_feed_ml INTEGER DEFAULT 0,
  flush_after_feed_ml INTEGER DEFAULT 0,
  flush_before_med_ml INTEGER DEFAULT 0,
  flush_after_med_ml INTEGER DEFAULT 0,
  flush_continuous_ml INTEGER,
  flush_continuous_interval_hours INTEGER,
  -- Position
  position_angle_min INTEGER DEFAULT 30,
  position_maintain_mins INTEGER DEFAULT 30,
  apply_position_to_medication BOOLEAN NOT NULL DEFAULT false,
  -- Schedule
  feed_schedule_times TEXT[] NOT NULL DEFAULT ARRAY['06:00','10:00','14:00','18:00','22:00','02:00'],
  grace_window_mins INTEGER NOT NULL DEFAULT 60,
  missed_feed_red_threshold INTEGER NOT NULL DEFAULT 2,
  -- Medication
  enable_medication_logging BOOLEAN NOT NULL DEFAULT false,
  -- Stoma checks
  enable_stoma_checks BOOLEAN NOT NULL DEFAULT true,
  -- Notifications
  escalation_recipients TEXT[] NOT NULL DEFAULT '{}',
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(client_id)
);

ALTER TABLE public.enteral_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral config" ON public.enteral_config
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin can insert enteral config" ON public.enteral_config
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can update enteral config" ON public.enteral_config
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_enteral_config_updated_at
  BEFORE UPDATE ON public.enteral_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Enteral Medication Configuration
CREATE TABLE public.enteral_medication_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  route TEXT,
  flush_before_ml INTEGER NOT NULL DEFAULT 0,
  flush_after_ml INTEGER NOT NULL DEFAULT 0,
  scheduled_times TEXT[] NOT NULL DEFAULT '{}',
  special_instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.enteral_medication_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral med config" ON public.enteral_medication_config
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin can insert enteral med config" ON public.enteral_medication_config
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can update enteral med config" ON public.enteral_medication_config
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete enteral med config" ON public.enteral_medication_config
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_enteral_med_config_updated_at
  BEFORE UPDATE ON public.enteral_medication_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Enteral Feed Logs
CREATE TABLE public.enteral_feed_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  scheduled_time TEXT,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  feed_volume_ml INTEGER NOT NULL,
  rate_ml_per_hour INTEGER,
  flush_given_ml INTEGER NOT NULL DEFAULT 0,
  method TEXT, -- 'pump', 'gravity', 'syringe'
  position_confirmed BOOLEAN NOT NULL DEFAULT false,
  position_angle INTEGER,
  position_override_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.enteral_feed_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral feed logs" ON public.enteral_feed_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert enteral feed logs" ON public.enteral_feed_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update enteral feed logs" ON public.enteral_feed_logs
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 4) Enteral Medication Logs
CREATE TABLE public.enteral_medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  medication_config_id UUID REFERENCES public.enteral_medication_config(id),
  medication_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  flush_before_ml INTEGER NOT NULL DEFAULT 0,
  flush_after_ml INTEGER NOT NULL DEFAULT 0,
  scheduled_time TEXT,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  position_confirmed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.enteral_medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral med logs" ON public.enteral_medication_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert enteral med logs" ON public.enteral_medication_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update enteral med logs" ON public.enteral_medication_logs
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 5) Enteral Stoma Checks
CREATE TABLE public.enteral_stoma_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  findings TEXT[] NOT NULL DEFAULT '{}',
  pain_level TEXT NOT NULL DEFAULT 'none',
  status_level TEXT NOT NULL DEFAULT 'green',
  escalation_type TEXT,
  action_taken TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.enteral_stoma_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral stoma checks" ON public.enteral_stoma_checks
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert enteral stoma checks" ON public.enteral_stoma_checks
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update enteral stoma checks" ON public.enteral_stoma_checks
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 6) Enteral Alerts
CREATE TABLE public.enteral_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
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

ALTER TABLE public.enteral_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral alerts" ON public.enteral_alerts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert enteral alerts" ON public.enteral_alerts
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update enteral alerts" ON public.enteral_alerts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.enteral_feed_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enteral_stoma_checks;
