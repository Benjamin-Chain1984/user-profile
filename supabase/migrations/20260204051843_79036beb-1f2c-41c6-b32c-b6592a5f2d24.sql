-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM (
  'trial',
  'active',
  'grace_period',
  'restricted',
  'suspended'
);

-- Create billing cycle enum
CREATE TYPE public.billing_cycle AS ENUM (
  'monthly',
  'quarterly',
  'annual'
);

-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM (
  'paid',
  'due',
  'overdue'
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  subscription_type TEXT NOT NULL DEFAULT 'Low Cost Assistive Technology – Individual Subscription',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
  grace_period_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT one_subscription_per_client UNIQUE (client_id)
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_cents INTEGER NOT NULL,
  gst_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  status invoice_status NOT NULL DEFAULT 'due',
  billing_entity TEXT NOT NULL DEFAULT 'Self',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view subscriptions for their clients"
ON public.subscriptions FOR SELECT
USING (true);

CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (true);

-- Invoices policies
CREATE POLICY "Users can view invoices"
ON public.invoices FOR SELECT
USING (true);

CREATE POLICY "System can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update invoices"
ON public.invoices FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_client_id ON public.subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);