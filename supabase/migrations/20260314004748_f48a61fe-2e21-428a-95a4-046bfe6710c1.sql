
CREATE TABLE public.enteral_flush_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  flush_reason TEXT NOT NULL,
  flush_volume_ml INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  edit_reason TEXT
);

ALTER TABLE public.enteral_flush_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enteral flush logs"
  ON public.enteral_flush_logs FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert enteral flush logs"
  ON public.enteral_flush_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update enteral flush logs"
  ON public.enteral_flush_logs FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()));
