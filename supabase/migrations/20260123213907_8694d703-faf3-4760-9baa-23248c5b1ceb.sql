-- Create catheter type enum
CREATE TYPE public.catheter_type AS ENUM (
  'spc',           -- Suprapubic Catheter
  'idc',           -- Indwelling Urethral Catheter
  'balloon',       -- Balloon-Retained Catheter
  'intermittent',  -- Intermittent Catheter (In/out)
  'urostomy',      -- Urostomy / Diversion
  'condom'         -- Condom Catheter (External Male)
);

-- Catheter Configuration (Admin settings per client)
CREATE TABLE public.catheter_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  catheter_type public.catheter_type NOT NULL DEFAULT 'idc',
  catheter_size TEXT,
  change_frequency_days INTEGER DEFAULT 28,
  flush_frequency_hours INTEGER,
  enable_stoma_checks BOOLEAN NOT NULL DEFAULT false,
  enable_flush_tracking BOOLEAN NOT NULL DEFAULT true,
  enable_autonomic_dysreflexia_risk BOOLEAN NOT NULL DEFAULT false,
  bag_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  escalation_recipients TEXT[] NOT NULL DEFAULT ARRAY['supervisor', 'nurse'],
  last_catheter_change TIMESTAMP WITH TIME ZONE,
  next_catheter_change_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(client_id)
);

-- Catheter Change Logs
CREATE TABLE public.catheter_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  catheter_type public.catheter_type NOT NULL,
  catheter_size TEXT,
  change_reason TEXT NOT NULL,
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

-- Catheter Flush Logs
CREATE TABLE public.catheter_flush_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  flush_volume_ml INTEGER,
  flush_solution TEXT DEFAULT 'saline',
  output_description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Stoma Site Checks (SPC & Urostomy only)
CREATE TABLE public.catheter_stoma_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stoma_condition TEXT NOT NULL,
  redness BOOLEAN NOT NULL DEFAULT false,
  swelling BOOLEAN NOT NULL DEFAULT false,
  pain BOOLEAN NOT NULL DEFAULT false,
  leaking BOOLEAN NOT NULL DEFAULT false,
  maceration BOOLEAN NOT NULL DEFAULT false,
  granulation BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  escalated_to_clinician BOOLEAN NOT NULL DEFAULT false,
  escalation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Bag Change Logs
CREATE TABLE public.catheter_bag_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bag_type TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Catheter Alerts
CREATE TABLE public.catheter_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'amber',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Consumables Usage Tracking
CREATE TABLE public.catheter_consumables_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  item_type TEXT NOT NULL,
  quantity_used INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Autonomic Dysreflexia Risk Logs
CREATE TABLE public.catheter_autonomic_risk_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  actions_taken TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  outcome TEXT,
  escalated BOOLEAN NOT NULL DEFAULT false,
  escalated_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID,
  edit_reason TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.catheter_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_flush_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_stoma_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_bag_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_consumables_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catheter_autonomic_risk_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catheter_config
CREATE POLICY "Admins can manage catheter config" ON public.catheter_config FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view catheter config" ON public.catheter_config FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_change_logs
CREATE POLICY "Staff can insert catheter change logs" ON public.catheter_change_logs FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update catheter change logs" ON public.catheter_change_logs FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view catheter change logs" ON public.catheter_change_logs FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_flush_logs
CREATE POLICY "Staff can insert flush logs" ON public.catheter_flush_logs FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update flush logs" ON public.catheter_flush_logs FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view flush logs" ON public.catheter_flush_logs FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_stoma_checks
CREATE POLICY "Staff can insert stoma checks" ON public.catheter_stoma_checks FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update stoma checks" ON public.catheter_stoma_checks FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view stoma checks" ON public.catheter_stoma_checks FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_bag_change_logs
CREATE POLICY "Staff can insert bag change logs" ON public.catheter_bag_change_logs FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update bag change logs" ON public.catheter_bag_change_logs FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view bag change logs" ON public.catheter_bag_change_logs FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_alerts
CREATE POLICY "Staff can insert catheter alerts" ON public.catheter_alerts FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update catheter alerts" ON public.catheter_alerts FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view catheter alerts" ON public.catheter_alerts FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_consumables_usage
CREATE POLICY "Staff can insert consumables usage" ON public.catheter_consumables_usage FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update consumables usage" ON public.catheter_consumables_usage FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view consumables usage" ON public.catheter_consumables_usage FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for catheter_autonomic_risk_logs
CREATE POLICY "Staff can insert autonomic risk logs" ON public.catheter_autonomic_risk_logs FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update autonomic risk logs" ON public.catheter_autonomic_risk_logs FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view autonomic risk logs" ON public.catheter_autonomic_risk_logs FOR SELECT USING (is_staff(auth.uid()));

-- Create trigger for updated_at on catheter_config
CREATE TRIGGER update_catheter_config_updated_at
  BEFORE UPDATE ON public.catheter_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on catheter_consumables_usage
CREATE TRIGGER update_catheter_consumables_usage_updated_at
  BEFORE UPDATE ON public.catheter_consumables_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();