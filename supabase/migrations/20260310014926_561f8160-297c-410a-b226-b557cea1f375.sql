
CREATE TABLE public.weekly_health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  insight_summary TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  enabled_modules TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (client_id)
);

ALTER TABLE public.weekly_health_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read insights"
  ON public.weekly_health_insights
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert/update insights"
  ON public.weekly_health_insights
  FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
