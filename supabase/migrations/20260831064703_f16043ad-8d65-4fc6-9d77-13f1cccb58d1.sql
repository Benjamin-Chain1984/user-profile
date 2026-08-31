CREATE TABLE public.client_ideal_signals (
  client_id uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'amber',
  red_count integer NOT NULL DEFAULT 0,
  amber_count integer NOT NULL DEFAULT 0,
  is_paused boolean NOT NULL DEFAULT false,
  needs_setup boolean NOT NULL DEFAULT true,
  top_alert_module text,
  top_alert_message text,
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_ideal_signals TO authenticated;
GRANT ALL ON public.client_ideal_signals TO service_role;

ALTER TABLE public.client_ideal_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view client ideal signals"
  ON public.client_ideal_signals FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can upsert client ideal signals"
  ON public.client_ideal_signals FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update client ideal signals"
  ON public.client_ideal_signals FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_client_ideal_signals_updated_at
  BEFORE UPDATE ON public.client_ideal_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();