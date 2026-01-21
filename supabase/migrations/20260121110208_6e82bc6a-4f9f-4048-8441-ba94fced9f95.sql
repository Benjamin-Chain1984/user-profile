-- Bowel Care Configuration (per-client settings)
CREATE TABLE public.bowel_care_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Constipation triggers
    no_bm_days_threshold INTEGER NOT NULL DEFAULT 3,
    type1_consecutive_days_threshold INTEGER NOT NULL DEFAULT 2,
    
    -- Monitoring after PRN
    monitor_hours_after_prn INTEGER NOT NULL DEFAULT 6,
    
    -- Escalation settings
    no_bm_after_prn_hours_escalation INTEGER NOT NULL DEFAULT 12,
    prn_dose_lookback_window_hours INTEGER NOT NULL DEFAULT 48,
    max_prn_doses_in_window INTEGER NOT NULL DEFAULT 3,
    max_prn_doses_per_24h INTEGER NOT NULL DEFAULT 2,
    
    -- Diarrhoea thresholds
    diarrhoea_type67_count_threshold INTEGER NOT NULL DEFAULT 3,
    diarrhoea_hours_window INTEGER NOT NULL DEFAULT 48,
    
    -- Alert recipients (array of roles/contacts)
    escalation_recipients TEXT[] NOT NULL DEFAULT ARRAY['supervisor', 'nurse']::TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(client_id)
);

-- PRN Medications (multiple per client)
CREATE TABLE public.bowel_prn_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dose_instructions TEXT NOT NULL,
    route TEXT CHECK (route IN ('oral', 'peg', 'rectal', 'other')),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Bowel Log Entries
CREATE TABLE public.bowel_log_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Bristol type (0 = no bowel motion, 1-7 = standard types)
    bristol_type INTEGER NOT NULL CHECK (bristol_type >= 0 AND bristol_type <= 7),
    
    -- Stool size
    stool_size TEXT CHECK (stool_size IN ('small', 'normal', 'large', 'unknown')),
    
    -- Observation status
    observed_status TEXT NOT NULL CHECK (observed_status IN ('observed', 'self_reported', 'not_observed')) DEFAULT 'observed',
    
    -- Optional indicators (stored as JSONB for flexibility)
    indicators JSONB DEFAULT '{}'::JSONB,
    -- Example: {"pain": "mild", "straining": true, "blood": "none", "mucus": false, "bloating": false, "vomiting": false, "abdominal_pain": "none"}
    
    notes TEXT,
    entry_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    edited_at TIMESTAMPTZ,
    edited_by UUID REFERENCES auth.users(id),
    edit_reason TEXT
);

-- PRN Administration Records
CREATE TABLE public.bowel_prn_administrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.bowel_prn_medications(id),
    
    medication_name TEXT NOT NULL,
    dose_given TEXT NOT NULL,
    administration_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Stool status prior to PRN
    prior_bristol_type INTEGER CHECK (prior_bristol_type >= 0 AND prior_bristol_type <= 7),
    
    -- Monitoring outcome
    monitoring_end_time TIMESTAMPTZ,
    bowel_motion_occurred BOOLEAN,
    outcome_recorded_at TIMESTAMPTZ,
    outcome_bristol_type INTEGER CHECK (outcome_bristol_type >= 0 AND outcome_bristol_type <= 7),
    
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    edited_at TIMESTAMPTZ,
    edited_by UUID REFERENCES auth.users(id),
    edit_reason TEXT
);

-- Bowel Care Alerts
CREATE TABLE public.bowel_care_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    alert_type TEXT NOT NULL CHECK (alert_type IN ('constipation_threshold', 'prn_recommended', 'no_bm_after_prn', 'prn_limit_reached', 'diarrhoea', 'red_flag', 'immediate_escalation')),
    severity TEXT NOT NULL CHECK (severity IN ('amber', 'red')) DEFAULT 'amber',
    
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Escalation Records
CREATE TABLE public.bowel_escalation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.bowel_care_alerts(id),
    
    escalation_reason TEXT NOT NULL,
    contacted_person TEXT NOT NULL,
    contact_role TEXT,
    contact_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    advice_received TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    edited_at TIMESTAMPTZ,
    edited_by UUID REFERENCES auth.users(id),
    edit_reason TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.bowel_care_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_prn_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_prn_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_care_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bowel_escalation_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bowel_care_config
CREATE POLICY "Admins can manage bowel care config" ON public.bowel_care_config
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view bowel care config" ON public.bowel_care_config
FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for bowel_prn_medications
CREATE POLICY "Admins can manage PRN medications" ON public.bowel_prn_medications
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view PRN medications" ON public.bowel_prn_medications
FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for bowel_log_entries
CREATE POLICY "Staff can insert bowel logs" ON public.bowel_log_entries
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update bowel logs" ON public.bowel_log_entries
FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view bowel logs" ON public.bowel_log_entries
FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for bowel_prn_administrations
CREATE POLICY "Staff can insert PRN administrations" ON public.bowel_prn_administrations
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update PRN administrations" ON public.bowel_prn_administrations
FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view PRN administrations" ON public.bowel_prn_administrations
FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for bowel_care_alerts
CREATE POLICY "Staff can insert bowel alerts" ON public.bowel_care_alerts
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update bowel alerts" ON public.bowel_care_alerts
FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view bowel alerts" ON public.bowel_care_alerts
FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for bowel_escalation_records
CREATE POLICY "Staff can insert escalation records" ON public.bowel_escalation_records
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update escalation records" ON public.bowel_escalation_records
FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view escalation records" ON public.bowel_escalation_records
FOR SELECT USING (public.is_staff(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_bowel_log_entries_client_time ON public.bowel_log_entries(client_id, entry_time DESC);
CREATE INDEX idx_bowel_prn_administrations_client_time ON public.bowel_prn_administrations(client_id, administration_time DESC);
CREATE INDEX idx_bowel_care_alerts_client_resolved ON public.bowel_care_alerts(client_id, resolved_at);
CREATE INDEX idx_bowel_prn_medications_client_active ON public.bowel_prn_medications(client_id, is_active);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bowel_log_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bowel_care_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bowel_prn_administrations;

-- Update timestamp triggers
CREATE TRIGGER update_bowel_care_config_updated_at
BEFORE UPDATE ON public.bowel_care_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bowel_prn_medications_updated_at
BEFORE UPDATE ON public.bowel_prn_medications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();