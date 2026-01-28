-- Weight & BMI Configuration table
CREATE TABLE public.weight_bmi_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Baseline
    baseline_weight_kg DECIMAL(5,2),
    
    -- Monitoring frequency
    monitoring_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (monitoring_frequency IN ('weekly', 'fortnightly', 'monthly')),
    
    -- Target weight range
    min_target_weight_kg DECIMAL(5,2),
    max_target_weight_kg DECIMAL(5,2),
    target_range_alert_severity TEXT DEFAULT 'amber' CHECK (target_range_alert_severity IN ('amber', 'red')),
    
    -- Rapid change detection
    enable_rapid_change_alert BOOLEAN NOT NULL DEFAULT true,
    rapid_change_threshold_kg DECIMAL(4,2) DEFAULT 2.0,
    rapid_change_window_days INTEGER DEFAULT 7,
    
    -- Height configuration
    height_cm DECIMAL(5,1),
    height_method TEXT DEFAULT 'standing' CHECK (height_method IN ('standing', 'arm_span', 'knee_height', 'demispan', 'historical', 'unknown')),
    height_is_estimate BOOLEAN DEFAULT false,
    height_method_notes TEXT,
    
    -- For knee height calculation
    knee_height_cm DECIMAL(5,1),
    knee_height_sex TEXT CHECK (knee_height_sex IN ('male', 'female', 'unknown')),
    
    -- Trend graph
    enable_trend_graph BOOLEAN NOT NULL DEFAULT true,
    
    -- Escalation
    escalation_recipients TEXT[] DEFAULT '{}',
    overdue_escalation_cycles INTEGER DEFAULT 2,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    
    UNIQUE(client_id)
);

-- Weight log entries table
CREATE TABLE public.weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Core data
    weight_kg DECIMAL(5,2) NOT NULL,
    event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Calculated BMI (stored for history)
    bmi_value DECIMAL(4,1),
    bmi_category TEXT CHECK (bmi_category IN ('underweight', 'normal', 'overweight', 'obese')),
    height_used_cm DECIMAL(5,1),
    
    -- Context
    time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
    meal_timing TEXT CHECK (meal_timing IN ('before_meal', 'after_meal')),
    wheelchair_context TEXT CHECK (wheelchair_context IN ('with_wheelchair', 'without_wheelchair')),
    notes TEXT,
    
    -- On-behalf-of logging
    recorded_on_behalf_of_name TEXT,
    recorded_on_behalf_of_role TEXT,
    recorded_on_behalf_of_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    edited_at TIMESTAMPTZ,
    edited_by UUID,
    edit_reason TEXT
);

-- Weight & BMI alerts table
CREATE TABLE public.weight_bmi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    alert_type TEXT NOT NULL CHECK (alert_type IN ('overdue_measurement', 'outside_target_range', 'rapid_weight_change', 'bmi_underweight', 'bmi_obese')),
    severity TEXT NOT NULL DEFAULT 'amber' CHECK (severity IN ('amber', 'red')),
    message TEXT NOT NULL,
    metadata JSONB,
    
    -- Resolution
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

-- Enable RLS
ALTER TABLE public.weight_bmi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_bmi_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weight_bmi_config
CREATE POLICY "Staff can view weight config"
ON public.weight_bmi_config FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert weight config"
ON public.weight_bmi_config FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update weight config"
ON public.weight_bmi_config FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete weight config"
ON public.weight_bmi_config FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for weight_entries
CREATE POLICY "Staff can view weight entries"
ON public.weight_entries FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert weight entries"
ON public.weight_entries FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update weight entries"
ON public.weight_entries FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can delete weight entries"
ON public.weight_entries FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for weight_bmi_alerts
CREATE POLICY "Staff can view weight alerts"
ON public.weight_bmi_alerts FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert weight alerts"
ON public.weight_bmi_alerts FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update weight alerts"
ON public.weight_bmi_alerts FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can delete weight alerts"
ON public.weight_bmi_alerts FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at on config
CREATE TRIGGER update_weight_bmi_config_updated_at
BEFORE UPDATE ON public.weight_bmi_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_bmi_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_entries;