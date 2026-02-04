-- Drop overly permissive policies on subscriptions
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.subscriptions;

-- Drop overly permissive policies on invoices
DROP POLICY IF EXISTS "System can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "System can update invoices" ON public.invoices;

-- Create proper RLS policies for subscriptions
CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (is_admin(auth.uid()));

-- Create proper RLS policies for invoices
CREATE POLICY "Admins can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update invoices"
ON public.invoices FOR UPDATE
USING (is_admin(auth.uid()));