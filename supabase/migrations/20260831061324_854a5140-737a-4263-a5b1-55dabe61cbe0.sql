CREATE TABLE public.client_staff_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_staff_access TO authenticated;
GRANT ALL ON public.client_staff_access TO service_role;

ALTER TABLE public.client_staff_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage client staff access"
ON public.client_staff_access FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view their own client access"
ON public.client_staff_access FOR SELECT TO authenticated
USING (user_id = auth.uid());