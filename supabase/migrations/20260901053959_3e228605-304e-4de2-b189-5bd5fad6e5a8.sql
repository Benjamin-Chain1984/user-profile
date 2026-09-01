-- Track whether the account owner has completed post-purchase onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Org-level access check: a user has access when they hold an active plan
-- themselves, OR an admin who granted them client access holds an active plan.
-- Used to suspend ALL staff access when the organisation subscription lapses.
CREATE OR REPLACE FUNCTION public.has_org_platform_access(
  user_uuid uuid,
  check_env text DEFAULT 'live'::text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_active_platform_subscription(user_uuid, check_env)
    OR EXISTS (
      SELECT 1
      FROM public.client_staff_access csa
      JOIN public.platform_subscriptions ps
        ON ps.user_id = csa.granted_by
       AND ps.environment = check_env
      WHERE csa.user_id = user_uuid
        AND (
          (ps.status IN ('active','trialing','past_due') AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
          OR (ps.status = 'canceled' AND ps.current_period_end > now())
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_org_platform_access(uuid, text) TO authenticated;