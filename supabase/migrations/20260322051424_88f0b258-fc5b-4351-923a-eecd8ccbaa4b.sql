
-- 1) Create undo_action_records table
CREATE TABLE public.undo_action_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  entry_id uuid NOT NULL,
  module_name text NOT NULL,
  entry_type text NOT NULL,
  entry_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  is_undone boolean NOT NULL DEFAULT false,
  undone_at timestamptz,
  undone_by uuid
);

ALTER TABLE public.undo_action_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read undo records"
  ON public.undo_action_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert undo records"
  ON public.undo_action_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update undo records"
  ON public.undo_action_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_undo_action_records_client ON public.undo_action_records(client_id, is_undone, created_at DESC);

-- 2) Add is_undone, undone_at, undone_by to all clinical log tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'abbey_pain_assessments',
    'annual_health_assessment_records',
    'bowel_log_entries',
    'bowel_prn_administrations',
    'bowel_escalation_records',
    'cancer_screening_records',
    'catheter_autonomic_risk_logs',
    'catheter_bag_change_logs',
    'catheter_change_logs',
    'catheter_flush_logs',
    'catheter_stoma_checks',
    'continence_consumables_checks',
    'continence_pad_changes',
    'continence_skin_checks',
    'continence_uti_tests',
    'enteral_feed_logs',
    'enteral_flush_logs',
    'enteral_medication_logs',
    'enteral_stoma_checks',
    'epilepsy_escalation_records',
    'fluid_intake_entries',
    'fluid_output_entries',
    'hydration_symptom_checks',
    'mealtime_observations',
    'oral_health_assessments',
    'oral_health_task_logs',
    'pain_action_records',
    'painad_assessments',
    'positioning_checks',
    'pressure_area_escalation_records',
    'pressure_relief_events',
    'seizure_actions',
    'seizure_events',
    'skin_check_sessions',
    'skin_finding_markers',
    'sleep_entries',
    'vaccination_records',
    'vital_sign_action_logs',
    'vital_sign_entries',
    'weight_entries'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS is_undone boolean NOT NULL DEFAULT false', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS undone_at timestamptz', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS undone_by uuid', tbl);
  END LOOP;
END $$;
