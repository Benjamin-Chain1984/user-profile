CREATE TABLE public.platform_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_subscriptions TO authenticated;
GRANT ALL ON public.platform_subscriptions TO service_role;

ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own platform subscription"
  ON public.platform_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_platform_subscriptions_user_id ON public.platform_subscriptions(user_id);
CREATE INDEX idx_platform_subscriptions_stripe_id ON public.platform_subscriptions(stripe_subscription_id);

CREATE TRIGGER update_platform_subscriptions_updated_at
BEFORE UPDATE ON public.platform_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_active_platform_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;