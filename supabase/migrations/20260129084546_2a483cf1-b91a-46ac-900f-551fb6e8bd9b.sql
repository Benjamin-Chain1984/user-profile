-- Fluid Balance Configuration Table
CREATE TABLE public.fluid_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  target_daily_intake_ml INTEGER NOT NULL DEFAULT 2000,
  enable_output_logging BOOLEAN NOT NULL DEFAULT true,
  day_boundary_time TIME NOT NULL DEFAULT '00:00:00',
  dehydration_threshold_ml INTEGER NOT NULL DEFAULT -500,
  overhydration_threshold_ml INTEGER NOT NULL DEFAULT 1000,
  fluid_restriction_enabled BOOLEAN NOT NULL DEFAULT false,
  max_fluid_allowance_ml INTEGER,
  hard_stop_on_limit_exceeded BOOLEAN NOT NULL DEFAULT false,
  escalation_recipients TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(client_id)
);

-- Fluid Intake Entries Table
CREATE TABLE public.fluid_intake_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  fluid_type TEXT NOT NULL,
  amount_ml INTEGER NOT NULL,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_self_reported BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  recorded_on_behalf_of_name TEXT,
  recorded_on_behalf_of_role TEXT,
  recorded_on_behalf_of_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Fluid Output Entries Table
CREATE TABLE public.fluid_output_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL,
  amount_ml INTEGER,
  is_unmeasured BOOLEAN NOT NULL DEFAULT false,
  urine_colour INTEGER CHECK (urine_colour >= 1 AND urine_colour <= 8),
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  recorded_on_behalf_of_name TEXT,
  recorded_on_behalf_of_role TEXT,
  recorded_on_behalf_of_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Hydration Symptom Checks Table
CREATE TABLE public.hydration_symptom_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  thirst_dry_mouth BOOLEAN NOT NULL DEFAULT false,
  fatigue_dizziness BOOLEAN NOT NULL DEFAULT false,
  confusion BOOLEAN NOT NULL DEFAULT false,
  swelling BOOLEAN NOT NULL DEFAULT false,
  nausea_vomiting BOOLEAN NOT NULL DEFAULT false,
  urine_colour INTEGER CHECK (urine_colour >= 1 AND urine_colour <= 8),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Fluid Balance Alerts Table
CREATE TABLE public.fluid_balance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'amber',
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.fluid_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluid_intake_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluid_output_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_symptom_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluid_balance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fluid_config
CREATE POLICY "Staff can view fluid config" ON public.fluid_config
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admin can manage fluid config" ON public.fluid_config
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for fluid_intake_entries
CREATE POLICY "Staff can view fluid intake entries" ON public.fluid_intake_entries
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert fluid intake entries" ON public.fluid_intake_entries
  FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update fluid intake entries" ON public.fluid_intake_entries
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- RLS Policies for fluid_output_entries
CREATE POLICY "Staff can view fluid output entries" ON public.fluid_output_entries
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert fluid output entries" ON public.fluid_output_entries
  FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update fluid output entries" ON public.fluid_output_entries
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- RLS Policies for hydration_symptom_checks
CREATE POLICY "Staff can view hydration symptom checks" ON public.hydration_symptom_checks
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert hydration symptom checks" ON public.hydration_symptom_checks
  FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update hydration symptom checks" ON public.hydration_symptom_checks
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- RLS Policies for fluid_balance_alerts
CREATE POLICY "Staff can view fluid balance alerts" ON public.fluid_balance_alerts
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert fluid balance alerts" ON public.fluid_balance_alerts
  FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update fluid balance alerts" ON public.fluid_balance_alerts
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.fluid_intake_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fluid_output_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fluid_balance_alerts;

-- Create indexes for performance
CREATE INDEX idx_fluid_intake_client_event ON public.fluid_intake_entries(client_id, event_occurred_at DESC);
CREATE INDEX idx_fluid_output_client_event ON public.fluid_output_entries(client_id, event_occurred_at DESC);
CREATE INDEX idx_fluid_alerts_client ON public.fluid_balance_alerts(client_id, created_at DESC);
CREATE INDEX idx_hydration_symptoms_client ON public.hydration_symptom_checks(client_id, check_date DESC);