/**
 * Continence Management Module - Types
 */

export type ScheduleType = 'fixed_times' | 'hourly' | 'as_required';
export type UTITestingFrequency = 'fortnightly' | 'weekly' | 'twice_weekly' | 'if_symptoms';
export type SkinCheckFrequency = 'daily' | 'twice_daily' | 'three_times_daily' | 'every_pad_change';

export type PadType = 'pull_up' | 'all_in_one' | 'insert_pad' | 'night_pad' | 'other';
export type PadCondition = 'dry' | 'lightly_wet' | 'soaked' | 'soiled_urine' | 'soiled_faeces' | 'mixed';
export type ChangeReason = 'scheduled' | 'wet' | 'soiled' | 'smell' | 'skin_irritation' | 'other';

export type SkinArea = 'groin' | 'perineum' | 'buttocks' | 'inner_thighs' | 'sacrum' | 'skin_folds' | 'other';
export type SkinCondition = 'clear' | 'redness' | 'rash' | 'broken_skin' | 'moisture_damage' | 'fungal_signs' | 'bruising';
export type MoistureStatus = 'dry' | 'damp' | 'wet' | 'macerated';
export type DiscomfortLevel = 'unknown' | 'none' | 'mild' | 'moderate' | 'severe';
export type BarrierCreamStatus = 'yes' | 'no' | 'not_prescribed';

export type ConsumableLevel = 'good' | 'medium' | 'low';
export type UTISymptom = 'cloudy_urine' | 'strong_smell' | 'incontinence_change' | 'pain' | 'behavioural_changes' | 'no_symptoms';
export type UTIResult = 'positive' | 'negative';
export type EscalatedTo = 'gp' | 'monitor_symptoms';

export type AlertType = 'missed_change' | 'skin_issue' | 'low_consumables' | 'uti_positive' | 'skin_check_overdue';
export type AlertSeverity = 'amber' | 'red';

export interface ContinenceConfig {
  id: string;
  client_id: string | null;
  schedule_type: ScheduleType;
  fixed_times: string[];
  interval_hours: number;
  enable_uti_testing: boolean;
  enable_hydration_link: boolean;
  enable_consumables_monitoring: boolean;
  uti_testing_frequency: UTITestingFrequency;
  skin_check_frequency: SkinCheckFrequency;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PadChangeLog {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  pad_type: PadType;
  pad_condition: PadCondition;
  change_reason: ChangeReason;
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

export interface SkinCheck {
  id: string;
  client_id: string | null;
  pad_change_id: string | null;
  event_occurred_at: string;
  areas_checked: SkinArea[];
  skin_condition: SkinCondition;
  moisture_status: MoistureStatus;
  discomfort_level: DiscomfortLevel;
  barrier_cream_applied: BarrierCreamStatus;
  escalated_to_clinician: boolean;
  escalation_notes: string | null;
  body_map_markers: BodyMapMarker[];
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

export interface BodyMapMarker {
  area: string;
  x: number;
  y: number;
  notes?: string;
}

export interface ConsumablesCheck {
  id: string;
  client_id: string | null;
  check_date: string;
  continence_pads_level: ConsumableLevel;
  barrier_creams_level: ConsumableLevel;
  gloves_wipes_level: ConsumableLevel;
  cleansing_products_level: ConsumableLevel;
  disposable_sheets_level: ConsumableLevel;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface UTITest {
  id: string;
  client_id: string | null;
  test_date: string;
  test_time: string;
  symptoms: UTISymptom[];
  test_result: UTIResult;
  escalated_to: EscalatedTo | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface ContinenceAlert {
  id: string;
  client_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
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

// Constants for UI
export const PAD_TYPES: { value: PadType; label: string }[] = [
  { value: 'pull_up', label: 'Pull-up' },
  { value: 'all_in_one', label: 'All-in-one' },
  { value: 'insert_pad', label: 'Insert Pad' },
  { value: 'night_pad', label: 'Night Pad' },
  { value: 'other', label: 'Other' },
];

export const PAD_CONDITIONS: { value: PadCondition; label: string }[] = [
  { value: 'dry', label: 'Dry' },
  { value: 'lightly_wet', label: 'Lightly Wet' },
  { value: 'soaked', label: 'Soaked' },
  { value: 'soiled_urine', label: 'Soiled (Urine)' },
  { value: 'soiled_faeces', label: 'Soiled (Faeces)' },
  { value: 'mixed', label: 'Mixed' },
];

export const CHANGE_REASONS: { value: ChangeReason; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'wet', label: 'Wet' },
  { value: 'soiled', label: 'Soiled' },
  { value: 'smell', label: 'Smell' },
  { value: 'skin_irritation', label: 'Skin Irritation' },
  { value: 'other', label: 'Other' },
];

export const SKIN_AREAS: { value: SkinArea; label: string }[] = [
  { value: 'groin', label: 'Groin' },
  { value: 'perineum', label: 'Perineum' },
  { value: 'buttocks', label: 'Buttocks' },
  { value: 'inner_thighs', label: 'Inner Thighs' },
  { value: 'sacrum', label: 'Sacrum' },
  { value: 'skin_folds', label: 'Skin Folds' },
  { value: 'other', label: 'Other' },
];

export const SKIN_CONDITIONS: { value: SkinCondition; label: string }[] = [
  { value: 'clear', label: 'Clear' },
  { value: 'redness', label: 'Redness' },
  { value: 'rash', label: 'Rash' },
  { value: 'broken_skin', label: 'Broken Skin' },
  { value: 'moisture_damage', label: 'Moisture Damage' },
  { value: 'fungal_signs', label: 'Fungal Signs' },
  { value: 'bruising', label: 'Bruising' },
];

export const MOISTURE_STATUSES: { value: MoistureStatus; label: string }[] = [
  { value: 'dry', label: 'Dry' },
  { value: 'damp', label: 'Damp' },
  { value: 'wet', label: 'Wet' },
  { value: 'macerated', label: 'Macerated' },
];

export const DISCOMFORT_LEVELS: { value: DiscomfortLevel; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

export const BARRIER_CREAM_OPTIONS: { value: BarrierCreamStatus; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_prescribed', label: 'Not Prescribed' },
];

export const CONSUMABLE_LEVELS: { value: ConsumableLevel; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const UTI_SYMPTOMS: { value: UTISymptom; label: string }[] = [
  { value: 'cloudy_urine', label: 'Cloudy Urine' },
  { value: 'strong_smell', label: 'Strong Smell' },
  { value: 'incontinence_change', label: 'Incontinence Change' },
  { value: 'pain', label: 'Pain' },
  { value: 'behavioural_changes', label: 'Behavioural Changes' },
  { value: 'no_symptoms', label: 'No Symptoms' },
];

export const SCHEDULE_TYPES: { value: ScheduleType; label: string; description: string }[] = [
  { value: 'fixed_times', label: 'Fixed Times', description: 'Set specific times for pad changes' },
  { value: 'hourly', label: 'Hourly Interval', description: 'Change every X hours' },
  { value: 'as_required', label: 'As Required', description: 'No schedule; log when needed' },
];

export const UTI_FREQUENCIES: { value: UTITestingFrequency; label: string }[] = [
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice_weekly', label: 'Twice Weekly' },
  { value: 'if_symptoms', label: 'If Symptoms' },
];

export const SKIN_CHECK_FREQUENCIES: { value: SkinCheckFrequency; label: string; description: string }[] = [
  { value: 'every_pad_change', label: 'Every Pad Change', description: 'Perform a skin check with every pad change' },
  { value: 'daily', label: 'Daily', description: 'Once per day' },
  { value: 'twice_daily', label: 'Twice Daily', description: 'Two checks per day' },
  { value: 'three_times_daily', label: 'Three Times Daily', description: 'Three checks per day' },
];

export const ON_BEHALF_REASONS = [
  { value: 'forgot_login', label: 'Forgot to log in' },
  { value: 'not_registered', label: 'Not a registered user' },
  { value: 'retrospective', label: 'Retrospective entry' },
  { value: 'other', label: 'Other' },
];

export const STAFF_ROLES = [
  { value: 'support_worker', label: 'Support Worker' },
  { value: 'agency_staff', label: 'Agency Staff' },
  { value: 'family', label: 'Family Member' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'other', label: 'Other' },
];
