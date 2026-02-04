-- Health Prevention Configuration (per client)
CREATE TABLE public.health_prevention_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    enable_cancer_screening BOOLEAN NOT NULL DEFAULT true,
    enable_vaccination_reminders BOOLEAN NOT NULL DEFAULT true,
    gp_practice_name TEXT,
    gp_contact_details TEXT,
    reminder_text TEXT DEFAULT 'Discuss at next GP visit',
    lung_screening_smoking_history TEXT CHECK (lung_screening_smoking_history IN ('yes', 'no', 'unsure')),
    escalation_recipients TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    UNIQUE(client_id)
);

-- Cancer Screening Records
CREATE TABLE public.cancer_screening_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    screening_type TEXT NOT NULL CHECK (screening_type IN ('bowel', 'breast', 'cervical', 'lung')),
    status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'completed', 'deferred', 'not_applicable')),
    date_completed DATE,
    location TEXT,
    outcome_known BOOLEAN,
    deferred_reason TEXT,
    notes TEXT,
    next_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by UUID,
    edit_reason TEXT
);

-- Vaccination Records
CREATE TABLE public.vaccination_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    vaccination_type TEXT NOT NULL CHECK (vaccination_type IN ('influenza', 'covid19', 'pneumococcal', 'shingles')),
    status TEXT NOT NULL DEFAULT 'not_recorded' CHECK (status IN ('not_recorded', 'due', 'completed')),
    date_given DATE,
    given_by TEXT,
    vaccine_brand TEXT,
    notes TEXT,
    next_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by UUID,
    edit_reason TEXT
);

-- Health Prevention Alerts
CREATE TABLE public.health_prevention_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('screening_due', 'screening_overdue', 'vaccination_due', 'vaccination_overdue')),
    item_type TEXT NOT NULL,
    item_name TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'amber' CHECK (severity IN ('amber', 'red')),
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

-- Enable RLS
ALTER TABLE public.health_prevention_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancer_screening_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_prevention_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_prevention_config
CREATE POLICY "Staff can view health prevention config" ON public.health_prevention_config
    FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert health prevention config" ON public.health_prevention_config
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update health prevention config" ON public.health_prevention_config
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for cancer_screening_records
CREATE POLICY "Staff can view cancer screening records" ON public.cancer_screening_records
    FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert cancer screening records" ON public.cancer_screening_records
    FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update cancer screening records" ON public.cancer_screening_records
    FOR UPDATE USING (public.is_staff(auth.uid()));

-- RLS Policies for vaccination_records
CREATE POLICY "Staff can view vaccination records" ON public.vaccination_records
    FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert vaccination records" ON public.vaccination_records
    FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update vaccination records" ON public.vaccination_records
    FOR UPDATE USING (public.is_staff(auth.uid()));

-- RLS Policies for health_prevention_alerts
CREATE POLICY "Staff can view health prevention alerts" ON public.health_prevention_alerts
    FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert health prevention alerts" ON public.health_prevention_alerts
    FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update health prevention alerts" ON public.health_prevention_alerts
    FOR UPDATE USING (public.is_staff(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_cancer_screening_client ON public.cancer_screening_records(client_id);
CREATE INDEX idx_cancer_screening_type ON public.cancer_screening_records(screening_type);
CREATE INDEX idx_vaccination_client ON public.vaccination_records(client_id);
CREATE INDEX idx_vaccination_type ON public.vaccination_records(vaccination_type);
CREATE INDEX idx_health_prevention_alerts_client ON public.health_prevention_alerts(client_id);
CREATE INDEX idx_health_prevention_alerts_resolved ON public.health_prevention_alerts(resolved_at);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_prevention_alerts;

-- Add update trigger for config
CREATE TRIGGER update_health_prevention_config_updated_at
    BEFORE UPDATE ON public.health_prevention_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();