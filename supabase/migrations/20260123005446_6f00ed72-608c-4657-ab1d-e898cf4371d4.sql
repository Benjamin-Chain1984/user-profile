-- Continence Management Module Schema

-- Continence Configuration (per client)
CREATE TABLE public.continence_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    schedule_type TEXT NOT NULL DEFAULT 'as_required', -- 'fixed_times', 'hourly', 'as_required'
    fixed_times TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g. ['08:00', '12:00', '16:00', '20:00']
    interval_hours INTEGER DEFAULT 4,
    enable_uti_testing BOOLEAN NOT NULL DEFAULT false,
    enable_hydration_link BOOLEAN NOT NULL DEFAULT false,
    enable_consumables_monitoring BOOLEAN NOT NULL DEFAULT false,
    uti_testing_frequency TEXT DEFAULT 'if_symptoms', -- 'fortnightly', 'weekly', 'twice_weekly', 'if_symptoms'
    escalation_recipients TEXT[] NOT NULL DEFAULT ARRAY['supervisor'::text, 'nurse'::text],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    UNIQUE(client_id)
);

-- Pad Change Logs
CREATE TABLE public.continence_pad_changes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    pad_type TEXT NOT NULL, -- 'pull_up', 'all_in_one', 'insert_pad', 'night_pad', 'other'
    pad_condition TEXT NOT NULL, -- 'dry', 'lightly_wet', 'soaked', 'soiled_urine', 'soiled_faeces', 'mixed'
    change_reason TEXT NOT NULL, -- 'scheduled', 'wet', 'soiled', 'smell', 'skin_irritation', 'other'
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

-- Skin Integrity Checks
CREATE TABLE public.continence_skin_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    pad_change_id UUID REFERENCES public.continence_pad_changes(id) ON DELETE SET NULL,
    event_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    areas_checked TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- 'groin', 'perineum', 'buttocks', 'inner_thighs', 'sacrum', 'skin_folds', 'other'
    skin_condition TEXT NOT NULL, -- 'clear', 'redness', 'rash', 'broken_skin', 'moisture_damage', 'fungal_signs', 'bruising'
    moisture_status TEXT NOT NULL, -- 'dry', 'damp', 'wet', 'macerated'
    discomfort_level TEXT NOT NULL DEFAULT 'unknown', -- 'unknown', 'none', 'mild', 'moderate', 'severe'
    barrier_cream_applied TEXT NOT NULL DEFAULT 'no', -- 'yes', 'no', 'not_prescribed'
    escalated_to_clinician BOOLEAN NOT NULL DEFAULT false,
    escalation_notes TEXT,
    body_map_markers JSONB DEFAULT '[]'::JSONB, -- [{area: 'groin', x: 50, y: 100, notes: '...'}]
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

-- Consumables Checks
CREATE TABLE public.continence_consumables_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    continence_pads_level TEXT NOT NULL, -- 'good', 'medium', 'low'
    barrier_creams_level TEXT NOT NULL,
    gloves_wipes_level TEXT NOT NULL,
    cleansing_products_level TEXT NOT NULL,
    disposable_sheets_level TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by UUID,
    edit_reason TEXT
);

-- UTI Tests
CREATE TABLE public.continence_uti_tests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_time TIME NOT NULL DEFAULT CURRENT_TIME,
    symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- 'cloudy_urine', 'strong_smell', 'incontinence_change', 'pain', 'behavioural_changes', 'no_symptoms'
    test_result TEXT NOT NULL, -- 'positive', 'negative'
    escalated_to TEXT, -- 'gp', 'monitor_symptoms', null
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by UUID,
    edit_reason TEXT
);

-- Continence Alerts
CREATE TABLE public.continence_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'missed_change', 'skin_issue', 'low_consumables', 'uti_positive', 'skin_check_overdue'
    severity TEXT NOT NULL DEFAULT 'amber', -- 'amber', 'red'
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

-- Enable RLS on all tables
ALTER TABLE public.continence_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continence_pad_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continence_skin_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continence_consumables_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continence_uti_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continence_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for continence_config
CREATE POLICY "Admins can manage continence config" ON public.continence_config FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view continence config" ON public.continence_config FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for continence_pad_changes
CREATE POLICY "Staff can view pad changes" ON public.continence_pad_changes FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert pad changes" ON public.continence_pad_changes FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update pad changes" ON public.continence_pad_changes FOR UPDATE USING (is_staff(auth.uid()));

-- RLS Policies for continence_skin_checks
CREATE POLICY "Staff can view skin checks" ON public.continence_skin_checks FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert skin checks" ON public.continence_skin_checks FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update skin checks" ON public.continence_skin_checks FOR UPDATE USING (is_staff(auth.uid()));

-- RLS Policies for continence_consumables_checks
CREATE POLICY "Staff can view consumables checks" ON public.continence_consumables_checks FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert consumables checks" ON public.continence_consumables_checks FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update consumables checks" ON public.continence_consumables_checks FOR UPDATE USING (is_staff(auth.uid()));

-- RLS Policies for continence_uti_tests
CREATE POLICY "Staff can view uti tests" ON public.continence_uti_tests FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert uti tests" ON public.continence_uti_tests FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update uti tests" ON public.continence_uti_tests FOR UPDATE USING (is_staff(auth.uid()));

-- RLS Policies for continence_alerts
CREATE POLICY "Staff can view continence alerts" ON public.continence_alerts FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert continence alerts" ON public.continence_alerts FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update continence alerts" ON public.continence_alerts FOR UPDATE USING (is_staff(auth.uid()));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.continence_pad_changes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.continence_alerts;