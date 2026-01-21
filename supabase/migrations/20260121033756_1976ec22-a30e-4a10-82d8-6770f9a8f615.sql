-- Abbey Pain Scale Configuration Table
CREATE TABLE public.abbey_pain_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    -- Assessment triggers (when should assessment be completed)
    assessment_triggers text[] NOT NULL DEFAULT ARRAY['daily']::text[],
    -- Custom trigger text for "Other" option
    custom_trigger_text text,
    -- Reassessment timeframes per severity band (in hours)
    mild_reassess_hours integer NOT NULL DEFAULT 4,
    moderate_reassess_hours integer NOT NULL DEFAULT 2,
    severe_reassess_hours integer NOT NULL DEFAULT 1,
    -- Alert recipients per severity band (JSON arrays of role strings)
    mild_alert_recipients text[] NOT NULL DEFAULT ARRAY['supervisor']::text[],
    moderate_alert_recipients text[] NOT NULL DEFAULT ARRAY['supervisor', 'nurse']::text[],
    severe_alert_recipients text[] NOT NULL DEFAULT ARRAY['supervisor', 'nurse', 'family', 'gp']::text[],
    -- Timestamps and audit
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    -- Unique per client (one config per client)
    UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.abbey_pain_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view abbey pain config"
ON public.abbey_pain_config
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage abbey pain config"
ON public.abbey_pain_config
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger_reason column to existing assessments table
ALTER TABLE public.abbey_pain_assessments 
ADD COLUMN IF NOT EXISTS trigger_reason text;

-- Update trigger for updated_at on config
CREATE TRIGGER update_abbey_pain_config_updated_at
BEFORE UPDATE ON public.abbey_pain_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();