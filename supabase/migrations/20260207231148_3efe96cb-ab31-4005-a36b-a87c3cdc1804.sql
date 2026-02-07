
-- Sleep Chart Module Tables

-- Sleep configuration table (admin-only settings)
CREATE TABLE public.sleep_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  min_expected_sleep_hours NUMERIC(3,1) NOT NULL DEFAULT 7,
  disruption_threshold INTEGER NOT NULL DEFAULT 3,
  poor_sleep_threshold_hours NUMERIC(3,1) NOT NULL DEFAULT 5,
  consecutive_disruption_alert_days INTEGER NOT NULL DEFAULT 3,
  escalation_recipients TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(client_id)
);

-- Sleep log entries table
CREATE TABLE public.sleep_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  bedtime TIMESTAMP WITH TIME ZONE NOT NULL,
  wake_time TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_hours_slept NUMERIC(4,2) NOT NULL,
  number_of_awakenings INTEGER NOT NULL DEFAULT 0,
  awake_period_length TEXT, -- 'less_than_10', '10_to_30', '30_plus'
  restlessness BOOLEAN NOT NULL DEFAULT false,
  day_nap BOOLEAN NOT NULL DEFAULT false,
  day_nap_duration_minutes INTEGER,
  day_nap_time TEXT,
  day_nap_behaviour_before TEXT,
  day_nap_notes TEXT,
  assistance_types TEXT[] NOT NULL DEFAULT '{}',
  assistance_other_text TEXT,
  notes TEXT,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_on_behalf_of_name TEXT,
  recorded_on_behalf_of_role TEXT,
  recorded_on_behalf_of_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Sleep alerts table
CREATE TABLE public.sleep_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'amber',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.sleep_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for sleep_config
CREATE POLICY "Staff can view sleep config" ON public.sleep_config
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage sleep config" ON public.sleep_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- RLS policies for sleep_entries
CREATE POLICY "Staff can view sleep entries" ON public.sleep_entries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert sleep entries" ON public.sleep_entries
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update sleep entries" ON public.sleep_entries
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- RLS policies for sleep_alerts
CREATE POLICY "Staff can view sleep alerts" ON public.sleep_alerts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage sleep alerts" ON public.sleep_alerts
  FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_sleep_config_updated_at
  BEFORE UPDATE ON public.sleep_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_alerts;
