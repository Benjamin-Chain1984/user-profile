-- Create abbey_pain_assessments table
CREATE TABLE public.abbey_pain_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Q1-Q6 scores (0, 1, or 2 each)
    q1_vocalization INTEGER NOT NULL CHECK (q1_vocalization >= 0 AND q1_vocalization <= 2),
    q2_facial_expression INTEGER NOT NULL CHECK (q2_facial_expression >= 0 AND q2_facial_expression <= 2),
    q3_body_language INTEGER NOT NULL CHECK (q3_body_language >= 0 AND q3_body_language <= 2),
    q4_behavioral_change INTEGER NOT NULL CHECK (q4_behavioral_change >= 0 AND q4_behavioral_change <= 2),
    q5_physiological_change INTEGER NOT NULL CHECK (q5_physiological_change >= 0 AND q5_physiological_change <= 2),
    q6_physical_change INTEGER NOT NULL CHECK (q6_physical_change >= 0 AND q6_physical_change <= 2),
    
    -- Calculated total score (0-12 range for 6 questions * 2 max each)
    total_score INTEGER NOT NULL,
    
    -- Severity: no_pain (0-2), mild (3-7), moderate (8-13), severe (14+)
    severity TEXT NOT NULL CHECK (severity IN ('no_pain', 'mild', 'moderate', 'severe')),
    
    -- Pain type
    pain_type TEXT NOT NULL CHECK (pain_type IN ('acute', 'chronic', 'acute_on_chronic')),
    
    -- Additional notes
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by UUID REFERENCES auth.users(id),
    edit_reason TEXT
);

-- Create pain_action_records table (required when score >= 3)
CREATE TABLE public.pain_action_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES public.abbey_pain_assessments(id) ON DELETE CASCADE,
    
    -- Action taken
    action_taken TEXT NOT NULL,
    action_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Outcome/follow-up
    outcome TEXT,
    outcome_recorded_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.abbey_pain_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pain_action_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for abbey_pain_assessments
CREATE POLICY "Staff can view pain assessments"
ON public.abbey_pain_assessments
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert pain assessments"
ON public.abbey_pain_assessments
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update pain assessments"
ON public.abbey_pain_assessments
FOR UPDATE
USING (is_staff(auth.uid()));

-- RLS policies for pain_action_records
CREATE POLICY "Staff can view pain actions"
ON public.pain_action_records
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert pain actions"
ON public.pain_action_records
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update pain actions"
ON public.pain_action_records
FOR UPDATE
USING (is_staff(auth.uid()));

-- Create indexes for common queries
CREATE INDEX idx_pain_assessments_client ON public.abbey_pain_assessments(client_id);
CREATE INDEX idx_pain_assessments_created ON public.abbey_pain_assessments(created_at DESC);
CREATE INDEX idx_pain_actions_assessment ON public.pain_action_records(assessment_id);