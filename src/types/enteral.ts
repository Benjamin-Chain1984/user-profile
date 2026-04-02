/**
 * Enteral Nutrition Module - Types
 */

export type TubeType =
  | 'peg_standard'
  | 'peg_balloon'
  | 'peg_button'
  | 'gj_tube'
  | 'jg_tube'
  | 'ng_tube'
  | 'njt';

export type FeedingType = 'continuous' | 'bolus' | 'gravity';
export type FeedMethod = 'pump' | 'gravity' | 'syringe';

export type EnteralStomaFinding =
  | 'clean_and_dry'
  | 'mild_redness'
  | 'tender'
  | 'swelling'
  | 'leakage'
  | 'bleeding'
  | 'pus_discharge'
  | 'strong_smell'
  | 'broken_skin';

export type EnteralStomaPainLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type EnteralStomaStatusLevel = 'green' | 'amber' | 'red';
export type EnteralEscalationType = 'rn' | 'gp' | 'monitoring' | 'other';

export interface FeedingScheduleEntry {
  id: string;
  time: string;
  type: 'feed' | 'flush';
  feed_ml: number;
  flush_before_ml: number;
  flush_after_ml: number;
  flush_ml?: number; // standalone flush volume
}

export interface EnteralConfig {
  id: string;
  client_id: string | null;
  nil_by_mouth: boolean;
  feeding_schedule: FeedingScheduleEntry[];
  tube_type: TubeType | null;
  tube_size_fr: string | null;
  tube_inserted_date: string | null;
  next_tube_change_due: string | null;
  tube_change_interval_days: number | null;
  tube_change_alert_lead_days: number;
  tube_change_overdue_days: number;
  formula_name: string | null;
  formula_custom_name: string | null;
  feeding_type: FeedingType | null;
  prescribed_volume_ml: number | null;
  flush_before_feed_ml: number;
  flush_after_feed_ml: number;
  flush_before_med_ml: number;
  flush_after_med_ml: number;
  flush_continuous_ml: number | null;
  flush_continuous_interval_hours: number | null;
  position_angle_min: number;
  position_maintain_mins: number;
  apply_position_to_medication: boolean;
  feed_schedule_times: string[];
  grace_window_mins: number;
  missed_feed_red_threshold: number;
  enable_medication_logging: boolean;
  enable_stoma_checks: boolean;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface EnteralMedicationConfig {
  id: string;
  client_id: string | null;
  medication_name: string;
  dose: string;
  route: string | null;
  flush_before_ml: number;
  flush_after_ml: number;
  scheduled_times: string[];
  special_instructions: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface EnteralFeedLog {
  id: string;
  client_id: string | null;
  scheduled_time: string | null;
  event_occurred_at: string;
  feed_volume_ml: number;
  rate_ml_per_hour: number | null;
  flush_given_ml: number;
  method: FeedMethod | null;
  position_confirmed: boolean;
  position_angle: number | null;
  position_override_reason: string | null;
  notes: string | null;
  recorded_on_behalf_of_name: string | null;
  recorded_on_behalf_of_role: string | null;
  recorded_on_behalf_of_reason: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}
  id: string;
  client_id: string | null;
  medication_config_id: string | null;
  medication_name: string;
  dose: string;
  flush_before_ml: number;
  flush_after_ml: number;
  scheduled_time: string | null;
  event_occurred_at: string;
  position_confirmed: boolean;
  notes: string | null;
  recorded_on_behalf_of_name: string | null;
  recorded_on_behalf_of_role: string | null;
  recorded_on_behalf_of_reason: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  findings: EnteralStomaFinding[];
  pain_level: EnteralStomaPainLevel;
  status_level: EnteralStomaStatusLevel;
  escalation_type: EnteralEscalationType | null;
  action_taken: string | null;
  notes: string | null;
  recorded_on_behalf_of_name: string | null;
  recorded_on_behalf_of_role: string | null;
  recorded_on_behalf_of_reason: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface EnteralAlert {
  id: string;
  client_id: string | null;
  alert_type: string;
  severity: 'amber' | 'red';
  message: string;
  metadata: Record<string, unknown>;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_reason: string | null;
  created_at: string;
  created_by: string | null;
}

// ── UI Constants ───────────────────────────────────────────────

export const TUBE_TYPES: { value: TubeType; label: string }[] = [
  { value: 'peg_standard', label: 'PEG – Standard (Silicone/Polyurethane)' },
  { value: 'peg_balloon', label: 'Balloon-Retained PEG' },
  { value: 'peg_button', label: 'Low-Profile Button PEG / Mickey Button' },
  { value: 'gj_tube', label: 'GJ Tube' },
  { value: 'jg_tube', label: 'JG Tube (Jejunostomy)' },
  { value: 'ng_tube', label: 'NG Tube' },
  { value: 'njt', label: 'Nasojejunal (NJT)' },
];

export const FORMULA_OPTIONS: string[] = [
  'Nutrison',
  'Isosource® Standard',
  'Nutrison Energy',
  'Isosource® 1.5 CAL',
  'Nutrison Protein Plus',
  'Isosource® Protein Fibre',
  'Nutrison Multi Fibre',
  'Isosource® Energy Fibre',
  'Nutrison Advanced Peptisorb',
  'Glucerna',
  'Nepro',
  'Jevity',
  'Osmolite',
  'Resource',
  'Other',
];

export const FEEDING_TYPES: { value: FeedingType; label: string }[] = [
  { value: 'continuous', label: 'Continuous (Pump)' },
  { value: 'bolus', label: 'Bolus' },
  { value: 'gravity', label: 'Gravity' },
];

export const FEED_METHODS: { value: FeedMethod; label: string }[] = [
  { value: 'pump', label: 'Pump' },
  { value: 'gravity', label: 'Gravity' },
  { value: 'syringe', label: 'Syringe' },
];

export const ENTERAL_STOMA_FINDINGS: { value: EnteralStomaFinding; label: string; severity: 'green' | 'amber' | 'red' }[] = [
  { value: 'clean_and_dry', label: 'Clean and dry', severity: 'green' },
  { value: 'mild_redness', label: 'Mild redness', severity: 'amber' },
  { value: 'tender', label: 'Tender', severity: 'amber' },
  { value: 'swelling', label: 'Swelling', severity: 'red' },
  { value: 'leakage', label: 'Leakage', severity: 'red' },
  { value: 'bleeding', label: 'Bleeding', severity: 'red' },
  { value: 'pus_discharge', label: 'Pus/discharge', severity: 'red' },
  { value: 'strong_smell', label: 'Strong smell', severity: 'red' },
  { value: 'broken_skin', label: 'Broken skin', severity: 'red' },
];

export const ENTERAL_STOMA_PAIN_LEVELS: { value: EnteralStomaPainLevel; label: string; severity: 'green' | 'amber' | 'red' }[] = [
  { value: 'none', label: 'None', severity: 'green' },
  { value: 'mild', label: 'Mild', severity: 'amber' },
  { value: 'moderate', label: 'Moderate', severity: 'red' },
  { value: 'severe', label: 'Severe', severity: 'red' },
];

export const ENTERAL_ESCALATION_TYPES: { value: EnteralEscalationType; label: string }[] = [
  { value: 'rn', label: 'RN notified' },
  { value: 'gp', label: 'GP notified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'other', label: 'Other' },
];

/** Tube types that require stoma checks */
export const STOMA_CHECK_TUBE_TYPES: TubeType[] = ['peg_standard', 'peg_balloon', 'peg_button', 'gj_tube', 'jg_tube'];

export function tubeRequiresStomaCheck(tubeType: TubeType | null | undefined): boolean {
  if (!tubeType) return false;
  return STOMA_CHECK_TUBE_TYPES.includes(tubeType);
}

export function calculateEnteralStomaStatus(
  findings: EnteralStomaFinding[],
  painLevel: EnteralStomaPainLevel,
  hoursSinceCheck: number | null
): EnteralStomaStatusLevel {
  const RED_FINDINGS: EnteralStomaFinding[] = ['leakage', 'bleeding', 'pus_discharge', 'broken_skin', 'swelling', 'strong_smell'];
  const AMBER_FINDINGS: EnteralStomaFinding[] = ['mild_redness', 'tender'];

  if (findings.some(f => RED_FINDINGS.includes(f))) return 'red';
  if (painLevel === 'severe' || painLevel === 'moderate') return 'red';
  if (hoursSinceCheck !== null && hoursSinceCheck > 48) return 'red';
  if (findings.some(f => AMBER_FINDINGS.includes(f))) return 'amber';
  if (painLevel === 'mild') return 'amber';
  if (hoursSinceCheck !== null && hoursSinceCheck > 24) return 'amber';
  return 'green';
}
