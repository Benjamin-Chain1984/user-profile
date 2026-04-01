
CREATE TABLE public.enteral_tube_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tube_type TEXT NOT NULL,
  tube_size_fr TEXT,
  change_reason TEXT NOT NULL,
  changed_by_professional TEXT,
  notes TEXT,
  is_undone BOOLEAN NOT NULL DEFAULT false,
  undone_at TIMESTAMPTZ,
  undone_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.enteral_tube_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tube change logs"
  ON public.enteral_tube_change_logs FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert tube change logs"
  ON public.enteral_tube_change_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update tube change logs"
  ON public.enteral_tube_change_logs FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()));
