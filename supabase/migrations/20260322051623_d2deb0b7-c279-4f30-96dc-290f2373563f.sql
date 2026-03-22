
-- Function to auto-log clinical entries to undo_action_records
CREATE OR REPLACE FUNCTION public.log_undo_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_module_name text;
  v_entry_type text;
BEGIN
  -- Derive module name from table
  v_module_name := TG_TABLE_NAME;
  v_entry_type := TG_TABLE_NAME;

  INSERT INTO public.undo_action_records (
    client_id, table_name, entry_id, module_name, entry_type,
    entry_snapshot, created_at, created_by
  ) VALUES (
    NEW.client_id,
    TG_TABLE_NAME,
    NEW.id,
    v_module_name,
    v_entry_type,
    to_jsonb(NEW),
    COALESCE(NEW.created_at, now()),
    NEW.created_by
  );

  RETURN NEW;
END;
$$;

-- Attach triggers to all clinical log tables
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
    EXECUTE format(
      'CREATE TRIGGER trg_undo_log_%I
       AFTER INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_undo_action()',
      tbl, tbl
    );
  END LOOP;
END $$;
