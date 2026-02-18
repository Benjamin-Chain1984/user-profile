
-- IDDSI & Safe Swallowing Module Tables

-- 1. IDDSI Configuration (Admin-set food/drink levels per client)
CREATE TABLE public.iddsi_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  food_level integer, -- 3-7 (null = not set)
  food_level_variant text, -- 'regular' or 'easy_to_chew' for level 7
  drink_level integer, -- 0-4 (null = not set)
  food_level_set_at timestamptz,
  drink_level_set_at timestamptz,
  last_review_date date,
  next_review_due date,
  additional_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE(client_id)
);

ALTER TABLE public.iddsi_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read iddsi_config"
  ON public.iddsi_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert iddsi_config"
  ON public.iddsi_config FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update iddsi_config"
  ON public.iddsi_config FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_iddsi_config_updated_at
  BEFORE UPDATE ON public.iddsi_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Mealtime Observations
CREATE TABLE public.mealtime_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  coughing text NOT NULL DEFAULT 'none', -- none, occasional, frequent
  wet_voice boolean NOT NULL DEFAULT false,
  throat_clearing boolean NOT NULL DEFAULT false,
  pocketing boolean NOT NULL DEFAULT false,
  fatigue boolean NOT NULL DEFAULT false,
  meal_completion_pct integer, -- 0-100
  refusal boolean NOT NULL DEFAULT false,
  severity text NOT NULL DEFAULT 'green', -- green, amber, red
  notes text,
  completed_by_name text NOT NULL,
  event_occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  edit_reason text,
  edited_at timestamptz,
  edited_by uuid
);

ALTER TABLE public.mealtime_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read mealtime_observations"
  ON public.mealtime_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert mealtime_observations"
  ON public.mealtime_observations FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update mealtime_observations"
  ON public.mealtime_observations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 3. Positioning Checks
CREATE TABLE public.positioning_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  angle_degrees numeric NOT NULL,
  person_upright boolean NOT NULL DEFAULT false,
  hips_at_back boolean NOT NULL DEFAULT false,
  feet_supported boolean NOT NULL DEFAULT false,
  head_midline boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'green', -- green, amber, red
  completed_by_name text NOT NULL,
  event_occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  notes text,
  edit_reason text,
  edited_at timestamptz,
  edited_by uuid
);

ALTER TABLE public.positioning_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read positioning_checks"
  ON public.positioning_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert positioning_checks"
  ON public.positioning_checks FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update positioning_checks"
  ON public.positioning_checks FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- 4. Swallowing Video Views (compliance log)
CREATE TABLE public.swallowing_video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  staff_user_id uuid,
  staff_name text NOT NULL,
  level_type text NOT NULL, -- 'food' or 'drink'
  level_value integer NOT NULL,
  skipped boolean NOT NULL DEFAULT false,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.swallowing_video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read swallowing_video_views"
  ON public.swallowing_video_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert swallowing_video_views"
  ON public.swallowing_video_views FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 5. IDDSI Alerts
CREATE TABLE public.iddsi_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'amber',
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  resolved_reason text
);

ALTER TABLE public.iddsi_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read iddsi_alerts"
  ON public.iddsi_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert iddsi_alerts"
  ON public.iddsi_alerts FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update iddsi_alerts"
  ON public.iddsi_alerts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
