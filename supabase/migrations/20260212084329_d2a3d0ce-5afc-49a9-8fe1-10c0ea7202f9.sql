
-- Table for Annual Comprehensive Health Assessment records
CREATE TABLE public.annual_health_assessment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  date_completed DATE NOT NULL,
  completed_by TEXT,
  location TEXT,
  notes TEXT,
  next_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

-- Enable RLS
ALTER TABLE public.annual_health_assessment_records ENABLE ROW LEVEL SECURITY;

-- RLS policies matching existing health prevention tables
CREATE POLICY "Users can view assessment records" ON public.annual_health_assessment_records
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert assessment records" ON public.annual_health_assessment_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update assessment records" ON public.annual_health_assessment_records
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete assessment records" ON public.annual_health_assessment_records
  FOR DELETE USING (auth.uid() IS NOT NULL);
