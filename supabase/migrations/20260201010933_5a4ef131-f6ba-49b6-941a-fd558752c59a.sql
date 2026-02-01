-- Centralised Notification Contacts + module recipient linking + notification event audit

-- 1) Notification contacts
CREATE TABLE IF NOT EXISTS public.notification_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL,
  email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,

  -- Optional / future-proof
  notes text NULL,
  preferred_contact_hours text NULL,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  edited_at timestamptz NULL,
  edited_by uuid NULL,
  edit_reason text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

-- Prevent duplicate emails per client (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS notification_contacts_client_email_uniq
  ON public.notification_contacts (client_id, lower(email));

-- 2) Module alert recipients (link table)
CREATE TABLE IF NOT EXISTS public.module_alert_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  alert_severity text NOT NULL,
  notification_contact_id uuid NOT NULL REFERENCES public.notification_contacts(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

-- Enforce valid severities (uses a CHECK; acceptable as it is immutable)
ALTER TABLE public.module_alert_recipients
  DROP CONSTRAINT IF EXISTS module_alert_recipients_alert_severity_check;
ALTER TABLE public.module_alert_recipients
  ADD CONSTRAINT module_alert_recipients_alert_severity_check
  CHECK (alert_severity IN ('amber','red'));

-- Prevent duplicates for same module+severity+contact
CREATE UNIQUE INDEX IF NOT EXISTS module_alert_recipients_uniq
  ON public.module_alert_recipients (client_id, module_name, alert_severity, notification_contact_id);

-- 3) Notification event audit
CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  module_name text NOT NULL,
  alert_id uuid NULL,
  alert_severity text NULL,
  notification_contact_id uuid NULL REFERENCES public.notification_contacts(id) ON DELETE SET NULL,
  contact_email text NOT NULL,
  contact_name text NOT NULL,
  delivery_method text NOT NULL DEFAULT 'email',
  delivery_status text NOT NULL DEFAULT 'sent',
  error_message text NULL,
  metadata jsonb NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_delivery_method_check;
ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_delivery_method_check
  CHECK (delivery_method IN ('email'));

ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_delivery_status_check;
ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_delivery_status_check
  CHECK (delivery_status IN ('sent','failed'));

ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_alert_severity_check;
ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_alert_severity_check
  CHECK (alert_severity IS NULL OR alert_severity IN ('amber','red'));

-- 4) Add missing columns to existing tables (safe no-ops if already present)
DO $$
BEGIN
  -- notification_contacts
  IF to_regclass('public.notification_contacts') IS NOT NULL THEN
    ALTER TABLE public.notification_contacts
      ADD COLUMN IF NOT EXISTS notes text NULL,
      ADD COLUMN IF NOT EXISTS preferred_contact_hours text NULL,
      ADD COLUMN IF NOT EXISTS relationship text;

    -- If relationship exists but is nullable/empty in some installs, keep nullable but ensure NOT NULL via default then set.
    -- We won't force NOT NULL here to avoid breaking existing rows.
  END IF;

  -- module_alert_recipients: ensure alert_severity is amber/red only
  IF to_regclass('public.module_alert_recipients') IS NOT NULL THEN
    ALTER TABLE public.module_alert_recipients
      ADD COLUMN IF NOT EXISTS alert_severity text;
  END IF;

  -- notification_events: ensure fields exist for audit copy
  IF to_regclass('public.notification_events') IS NOT NULL THEN
    ALTER TABLE public.notification_events
      ADD COLUMN IF NOT EXISTS alert_severity text,
      ADD COLUMN IF NOT EXISTS delivery_method text,
      ADD COLUMN IF NOT EXISTS delivery_status text,
      ADD COLUMN IF NOT EXISTS error_message text,
      ADD COLUMN IF NOT EXISTS metadata jsonb,
      ADD COLUMN IF NOT EXISTS contact_email text,
      ADD COLUMN IF NOT EXISTS contact_name text;
  END IF;
END$$;

-- 5) updated_at triggers
DROP TRIGGER IF EXISTS trg_notification_contacts_updated_at ON public.notification_contacts;
CREATE TRIGGER trg_notification_contacts_updated_at
BEFORE UPDATE ON public.notification_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_module_alert_recipients_updated_at ON public.module_alert_recipients;
CREATE TRIGGER trg_module_alert_recipients_updated_at
BEFORE UPDATE ON public.module_alert_recipients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Row Level Security
ALTER TABLE public.notification_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Staff can view notification contacts" ON public.notification_contacts;
DROP POLICY IF EXISTS "Admins can manage notification contacts" ON public.notification_contacts;

DROP POLICY IF EXISTS "Staff can view module alert recipients" ON public.module_alert_recipients;
DROP POLICY IF EXISTS "Admins can manage module alert recipients" ON public.module_alert_recipients;

DROP POLICY IF EXISTS "Staff can view notification events" ON public.notification_events;
DROP POLICY IF EXISTS "Staff can insert notification events" ON public.notification_events;
DROP POLICY IF EXISTS "Admins can view notification events" ON public.notification_events;

-- notification_contacts policies
CREATE POLICY "Staff can view notification contacts"
ON public.notification_contacts
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage notification contacts"
ON public.notification_contacts
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- module_alert_recipients policies
CREATE POLICY "Staff can view module alert recipients"
ON public.module_alert_recipients
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage module alert recipients"
ON public.module_alert_recipients
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- notification_events policies (auditable by staff; insert allowed for staff/admin)
CREATE POLICY "Staff can view notification events"
ON public.notification_events
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert notification events"
ON public.notification_events
FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));
