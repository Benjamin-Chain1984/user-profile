CREATE OR REPLACE FUNCTION public.has_workspace_access(
  user_uuid uuid,
  check_env text DEFAULT 'live'::text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.has_org_platform_access(user_uuid, check_env)
    OR (
      NOT EXISTS (SELECT 1 FROM public.platform_subscriptions WHERE environment = check_env)
      AND (
        public.is_admin(user_uuid)
        OR public.is_staff(user_uuid)
        OR EXISTS (SELECT 1 FROM public.client_staff_access WHERE user_id = user_uuid)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_workspace_access(uuid, text) TO authenticated;