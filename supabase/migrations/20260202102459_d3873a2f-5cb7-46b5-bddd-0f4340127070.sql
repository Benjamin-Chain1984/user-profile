-- =====================================================
-- Health Monitoring Module - Database Schema
-- =====================================================

-- VITAL SIGN ENTRIES (core logging table)
CREATE TABLE public.vital_sign_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Vitals data
    temperature_celsius DECIMAL(4,2),
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    oxygen_saturation INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    
    -- Calculated status per vital (for quick queries)
    temperature_status TEXT CHECK (temperature_status IN ('ideal', 'amber', 'red')),
    bp_status TEXT CHECK (bp_status IN ('ideal', 'amber', 'red')),
    oxygen_status TEXT CHECK (oxygen_status IN ('ideal', 'amber', 'red')),
    heart_rate_status TEXT CHECK (heart_rate_status IN ('ideal', 'amber', 'red')),
    respiratory_status TEXT CHECK (respiratory_status IN ('ideal', 'amber', 'red')),
    
    -- Overall worst status for this entry
    overall_status TEXT NOT NULL DEFAULT 'ideal' CHECK (overall_status IN ('ideal', 'amber', 'red')),
    
    -- Associated symptoms
    symptoms TEXT[] DEFAULT '{}',
    
    -- Notes
    notes TEXT,
    
    -- Audit trail
    event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMPTZ,
    edited_by UUID,
    edit_reason TEXT,
    
    -- On-behalf-of logging
    recorded_on_behalf_of_name TEXT,
    recorded_on_behalf_of_role TEXT,
    recorded_on_behalf_of_reason TEXT
);

-- VITAL SIGN CONFIG (per-client settings)
CREATE TABLE public.vital_sign_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
    
    -- Monitoring frequency (hours, null = no scheduled monitoring)
    temperature_frequency_hours INTEGER,
    bp_frequency_hours INTEGER,
    oxygen_frequency_hours INTEGER,
    heart_rate_frequency_hours INTEGER,
    respiratory_frequency_hours INTEGER,
    
    -- Enable/disable individual vitals
    temperature_enabled BOOLEAN NOT NULL DEFAULT true,
    bp_enabled BOOLEAN NOT NULL DEFAULT true,
    oxygen_enabled BOOLEAN NOT NULL DEFAULT true,
    heart_rate_enabled BOOLEAN NOT NULL DEFAULT true,
    respiratory_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Amber alert recheck hours (default 2)
    amber_recheck_hours INTEGER NOT NULL DEFAULT 2,
    
    -- Escalation settings
    escalation_recipients TEXT[] DEFAULT '{}',
    
    -- Log on behalf feature
    enable_log_on_behalf BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID
);

-- ALTERED CRITERIA (custom thresholds per client)
CREATE TABLE public.vital_sign_altered_criteria (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    -- Vital type: temperature, bp_systolic, bp_diastolic, oxygen, heart_rate, respiratory
    vital_type TEXT NOT NULL,
    
    -- Custom thresholds (null = use standard)
    green_min DECIMAL(10,2),
    green_max DECIMAL(10,2),
    amber_low_min DECIMAL(10,2),
    amber_low_max DECIMAL(10,2),
    amber_high_min DECIMAL(10,2),
    amber_high_max DECIMAL(10,2),
    
    -- Medical professional confirmation
    confirmed_by_medical_professional BOOLEAN NOT NULL DEFAULT false,
    medical_professional_name TEXT,
    medical_professional_role TEXT,
    confirmation_date DATE,
    clinical_reason TEXT,
    
    -- Admin approval
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    -- Is active
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    
    -- Unique constraint per client + vital type
    UNIQUE(client_id, vital_type)
);

-- VITAL SIGN ALERTS
CREATE TABLE public.vital_sign_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    vital_entry_id UUID REFERENCES public.vital_sign_entries(id) ON DELETE SET NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL, -- e.g., 'temperature_high', 'bp_critical', 'multi_vital_trend'
    vital_type TEXT, -- which vital triggered it (null for multi-vital)
    severity TEXT NOT NULL DEFAULT 'amber' CHECK (severity IN ('amber', 'red')),
    message TEXT NOT NULL,
    recommended_action TEXT,
    
    -- For recurring/trend alerts
    is_trend_alert BOOLEAN NOT NULL DEFAULT false,
    trend_data JSONB,
    
    -- Acknowledgment
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_reason TEXT,
    action_taken TEXT,
    emergency_services_contacted BOOLEAN DEFAULT false,
    emergency_contact_time TIMESTAMPTZ,
    outcome TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

-- ACTION LOGS (for documenting responses to alerts)
CREATE TABLE public.vital_sign_action_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.vital_sign_alerts(id) ON DELETE SET NULL,
    vital_entry_id UUID REFERENCES public.vital_sign_entries(id) ON DELETE SET NULL,
    
    -- Action details
    action_type TEXT NOT NULL, -- 'recheck', 'escalate', 'emergency_call', 'gp_contacted', 'advice_followed'
    action_description TEXT NOT NULL,
    
    -- Who was contacted
    contacted_person TEXT,
    contact_role TEXT,
    contact_time TIMESTAMPTZ,
    advice_received TEXT,
    
    -- Outcome
    outcome TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_due_at TIMESTAMPTZ,
    
    -- Audit trail
    event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMPTZ,
    edited_by UUID,
    edit_reason TEXT
);

-- Enable Row Level Security on all tables
ALTER TABLE public.vital_sign_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_sign_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_sign_altered_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_sign_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_sign_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vital_sign_entries
CREATE POLICY "Staff can view vital sign entries"
ON public.vital_sign_entries FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert vital sign entries"
ON public.vital_sign_entries FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update vital sign entries"
ON public.vital_sign_entries FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()));

-- RLS Policies for vital_sign_config
CREATE POLICY "Staff can view vital sign config"
ON public.vital_sign_config FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage vital sign config"
ON public.vital_sign_config FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for vital_sign_altered_criteria
CREATE POLICY "Staff can view altered criteria"
ON public.vital_sign_altered_criteria FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage altered criteria"
ON public.vital_sign_altered_criteria FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for vital_sign_alerts
CREATE POLICY "Staff can view vital sign alerts"
ON public.vital_sign_alerts FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert vital sign alerts"
ON public.vital_sign_alerts FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update vital sign alerts"
ON public.vital_sign_alerts FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()));

-- RLS Policies for vital_sign_action_logs
CREATE POLICY "Staff can view action logs"
ON public.vital_sign_action_logs FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert action logs"
ON public.vital_sign_action_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update action logs"
ON public.vital_sign_action_logs FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_vital_entries_client ON public.vital_sign_entries(client_id);
CREATE INDEX idx_vital_entries_event ON public.vital_sign_entries(event_occurred_at DESC);
CREATE INDEX idx_vital_entries_status ON public.vital_sign_entries(overall_status);
CREATE INDEX idx_vital_alerts_client ON public.vital_sign_alerts(client_id);
CREATE INDEX idx_vital_alerts_unresolved ON public.vital_sign_alerts(client_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_vital_altered_criteria_client ON public.vital_sign_altered_criteria(client_id, vital_type);

-- Add trigger for updated_at on config
CREATE TRIGGER update_vital_sign_config_updated_at
BEFORE UPDATE ON public.vital_sign_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vital_sign_altered_criteria_updated_at
BEFORE UPDATE ON public.vital_sign_altered_criteria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for vital sign entries and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_sign_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_sign_alerts;