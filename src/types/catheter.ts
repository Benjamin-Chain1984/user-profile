/**
 * Urinary Catheter Management Module - Types
 */

export type CatheterType = 'spc' | 'idc' | 'balloon' | 'intermittent' | 'urostomy' | 'condom';

export type BagType = 'night_bag' | 'leg_bag' | 'belly_bag' | 'flip_flow' | 'urostomy_bag' | 'condom_bag' | 'other';

export type StomaCondition = 'healthy' | 'redness' | 'swelling' | 'pain' | 'leaking' | 'maceration' | 'granulation';

// Enhanced stoma check types
export type StomaFinding =
  | 'clean_and_dry'
  | 'mild_redness'
  | 'slight_tenderness'
  | 'minor_crusting'
  | 'moisture_around_site'
  | 'leakage_around_catheter'
  | 'swelling'
  | 'bleeding'
  | 'pus_discharge'
  | 'strong_odour'
  | 'skin_breakdown';

export type StomaPainLevel = 'none' | 'mild_discomfort' | 'moderate_pain' | 'severe_pain';

export type StomaDressingStatus = 'intact' | 'changed' | 'not_applicable';

export type StomaStatusLevel = 'green' | 'amber' | 'red';

export type StomaEscalationType = 'rn' | 'gp' | 'on_call' | 'emergency' | 'not_yet';

export type BagCondition = 'clear_urine' | 'cloudy' | 'sediment' | 'blood_visible' | 'odour' | 'other';

export type BagChangeFrequency = 'daily' | 'every_x_days' | 'prn';

export type FlushSolution = 'saline' | 'sterile_water' | 'other';

export type FlushFrequency = 'prn' | 'daily' | 'twice_daily' | 'custom';

export type FlushPerformer = 'rn' | 'support_worker';

export type FlushReason = 'routine' | 'low_output' | 'sediment' | 'blockage_risk' | 'urology_plan' | 'other';

export type UrineAppearance = 'clear' | 'cloudy' | 'blood' | 'sediment';

export type FlowAfterFlush = 'improved' | 'unchanged' | 'worse';

export type PersonResponse = 'comfortable' | 'pain' | 'distressed';

export type ChangeReason = 'routine' | 'blockage' | 'leakage' | 'infection' | 'malfunction' | 'scheduled' | 'other';

export type BagChangeReason = 'routine' | 'soiled' | 'damaged' | 'leakage' | 'blockage' | 'infection_control' | 'other';

export type AlertType = 'change_due' | 'change_overdue' | 'flush_due' | 'flush_overdue' | 'stoma_concern' | 'low_consumables' | 'autonomic_dysreflexia';

export type AlertSeverity = 'amber' | 'red';

export type ADSymptom = 'headache' | 'flushing' | 'sweating' | 'nasal_congestion' | 'blurred_vision' | 'bradycardia' | 'hypertension' | 'goosebumps' | 'anxiety';

export type ADAction = 'sit_upright' | 'loosen_clothing' | 'check_catheter' | 'drain_bladder' | 'call_emergency';

// Dynamic field configuration per catheter type
export interface CatheterTypeConfig {
  enableStomaChecks: boolean;
  enableFlushTracking: boolean;
  enableBalloonVolume: boolean;
  defaultChangeFrequencyDays: number;
  allowedBagTypes: BagType[];
  sizeOptions: string[];
  sizeLabel: string;
}

/** Map DB values (which may differ from CatheterType keys) to CatheterType */
export function normalizeCatheterType(dbValue: string | null | undefined): CatheterType | undefined {
  if (!dbValue) return undefined;
  const map: Record<string, CatheterType> = {
    spc: 'spc',
    suprapubic: 'spc',
    idc: 'idc',
    indwelling_urethral: 'idc',
    balloon: 'balloon',
    intermittent: 'intermittent',
    urostomy: 'urostomy',
    condom: 'condom',
  };
  return map[dbValue] ?? undefined;
}

export const CATHETER_TYPE_CONFIG: Record<CatheterType, CatheterTypeConfig> = {
  spc: {
    enableStomaChecks: true,
    enableFlushTracking: true,
    enableBalloonVolume: false,
    defaultChangeFrequencyDays: 56, // 6-12 weeks
    allowedBagTypes: ['night_bag', 'leg_bag', 'flip_flow'],
    sizeOptions: ['12Fr', '14Fr', '16Fr', '18Fr'],
    sizeLabel: 'Select catheter size (Fr)',
  },
  idc: {
    enableStomaChecks: false,
    enableFlushTracking: true,
    enableBalloonVolume: false,
    defaultChangeFrequencyDays: 28, // 4-6 weeks
    allowedBagTypes: ['night_bag', 'leg_bag', 'flip_flow'],
    sizeOptions: ['12Fr', '14Fr', '16Fr'],
    sizeLabel: 'Select catheter size (Fr)',
  },
  balloon: {
    enableStomaChecks: false,
    enableFlushTracking: true,
    enableBalloonVolume: true,
    defaultChangeFrequencyDays: 21, // 3-6 weeks
    allowedBagTypes: ['night_bag', 'leg_bag', 'flip_flow'],
    sizeOptions: ['12Fr', '14Fr', '16Fr', '18Fr'],
    sizeLabel: 'Select catheter size (Fr)',
  },
  intermittent: {
    enableStomaChecks: false,
    enableFlushTracking: false,
    enableBalloonVolume: false,
    defaultChangeFrequencyDays: 0, // Single use
    allowedBagTypes: [],
    sizeOptions: ['8Fr', '10Fr', '12Fr', '14Fr', '16Fr'],
    sizeLabel: 'Select catheter size (Fr)',
  },
  urostomy: {
    enableStomaChecks: true,
    enableFlushTracking: false,
    enableBalloonVolume: false,
    defaultChangeFrequencyDays: 3, // Daily to weekly
    allowedBagTypes: ['urostomy_bag'],
    sizeOptions: [],
    sizeLabel: '',
  },
  condom: {
    enableStomaChecks: false,
    enableFlushTracking: false,
    enableBalloonVolume: false,
    defaultChangeFrequencyDays: 1, // 24-48 hours
    allowedBagTypes: ['night_bag', 'leg_bag', 'condom_bag'],
    sizeOptions: ['Small', 'Medium', 'Large', 'XL'],
    sizeLabel: 'Select sheath size',
  },
};

export interface CatheterConfig {
  id: string;
  client_id: string | null;
  catheter_type: CatheterType;
  catheter_size: string | null;
  change_frequency_days: number;
  flush_frequency_hours: number | null;
  enable_stoma_checks: boolean;
  enable_flush_tracking: boolean;
  enable_autonomic_dysreflexia_risk: boolean;
  bag_types: BagType[];
  escalation_recipients: string[];
  last_catheter_change: string | null;
  next_catheter_change_due: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface CatheterChangeLog {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  catheter_type: CatheterType;
  catheter_size: string | null;
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

export interface FlushLog {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  flush_volume_ml: number | null;
  flush_solution: FlushSolution;
  output_description: string | null;
  notes: string | null;
  return_volume_ml: number | null;
  flush_reason: string | null;
  urine_appearance: string | null;
  flow_after_flush: string | null;
  person_response: string | null;
  training_confirmed: boolean;
  escalation_required: boolean;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface StomaCheck {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  stoma_condition: StomaCondition;
  redness: boolean;
  swelling: boolean;
  pain: boolean;
  leaking: boolean;
  maceration: boolean;
  granulation: boolean;
  findings: StomaFinding[];
  pain_level: StomaPainLevel;
  dressing_status: StomaDressingStatus;
  status_level: StomaStatusLevel;
  escalation_type: StomaEscalationType | null;
  action_taken: string | null;
  notes: string | null;
  escalated_to_clinician: boolean;
  escalation_notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface BagChangeLog {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  bag_type: BagType;
  change_reason: BagChangeReason;
  condition: BagCondition | null;
  tubing_changed: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface CatheterBagConfig {
  id: string;
  client_id: string | null;
  bag_type: string;
  stock_level: number;
  low_stock_threshold: number;
  change_frequency: BagChangeFrequency | null;
  change_frequency_days: number | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface CatheterAlert {
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

export interface ConsumablesUsage {
  id: string;
  client_id: string | null;
  month_year: string;
  item_type: string;
  quantity_used: number;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface AutonomicRiskLog {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  symptoms: ADSymptom[];
  actions_taken: ADAction[];
  outcome: string | null;
  escalated: boolean;
  escalated_to: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

// UI Constants
export const CATHETER_TYPES: { value: CatheterType; label: string; description: string }[] = [
  { value: 'spc', label: 'Suprapubic Catheter (SPC)', description: 'Inserted through abdomen into bladder' },
  { value: 'idc', label: 'Indwelling Urethral Catheter (IDC)', description: 'Inserted through urethra' },
  { value: 'balloon', label: 'Balloon-Retained Catheter', description: 'Held in place by inflated balloon' },
  { value: 'intermittent', label: 'Intermittent Catheter', description: 'Single-use, in-and-out catheter' },
  { value: 'urostomy', label: 'Urostomy / Urinary Diversion', description: 'Surgical urinary stoma' },
  { value: 'condom', label: 'Condom Catheter (External)', description: 'External sheath for males' },
];

export const BAG_TYPES: { value: BagType; label: string }[] = [
  { value: 'leg_bag', label: 'Leg Bag' },
  { value: 'night_bag', label: 'Night Drainage Bag' },
  { value: 'belly_bag', label: 'Belly Bag' },
  { value: 'flip_flow', label: 'Flip-Flow Valve' },
  { value: 'urostomy_bag', label: 'Urostomy Drainage Bag' },
  { value: 'condom_bag', label: 'Condom Catheter Drainage Bag' },
  { value: 'other', label: 'Other' },
];

export const STOMA_CONDITIONS: { value: StomaCondition; label: string }[] = [
  { value: 'healthy', label: 'Healthy / Good' },
  { value: 'redness', label: 'Redness' },
  { value: 'swelling', label: 'Swelling' },
  { value: 'pain', label: 'Pain' },
  { value: 'leaking', label: 'Leaking' },
  { value: 'maceration', label: 'Maceration (skin softening)' },
  { value: 'granulation', label: 'Granulation (extra tissue growth)' },
];

export const STOMA_FINDINGS: { value: StomaFinding; label: string; severity: 'green' | 'amber' | 'red' }[] = [
  { value: 'clean_and_dry', label: 'Clean and dry', severity: 'green' },
  { value: 'mild_redness', label: 'Mild redness', severity: 'amber' },
  { value: 'slight_tenderness', label: 'Slight tenderness', severity: 'amber' },
  { value: 'minor_crusting', label: 'Minor crusting', severity: 'amber' },
  { value: 'moisture_around_site', label: 'Moisture around site', severity: 'amber' },
  { value: 'leakage_around_catheter', label: 'Leakage around catheter', severity: 'red' },
  { value: 'swelling', label: 'Swelling', severity: 'red' },
  { value: 'bleeding', label: 'Bleeding', severity: 'red' },
  { value: 'pus_discharge', label: 'Pus / discharge', severity: 'red' },
  { value: 'strong_odour', label: 'Strong odour', severity: 'red' },
  { value: 'skin_breakdown', label: 'Skin breakdown', severity: 'red' },
];

export const STOMA_PAIN_LEVELS: { value: StomaPainLevel; label: string; severity: 'green' | 'amber' | 'red' }[] = [
  { value: 'none', label: 'None', severity: 'green' },
  { value: 'mild_discomfort', label: 'Mild discomfort', severity: 'amber' },
  { value: 'moderate_pain', label: 'Moderate pain', severity: 'red' },
  { value: 'severe_pain', label: 'Severe pain', severity: 'red' },
];

export const STOMA_DRESSING_OPTIONS: { value: StomaDressingStatus; label: string }[] = [
  { value: 'intact', label: 'Intact' },
  { value: 'changed', label: 'Changed' },
  { value: 'not_applicable', label: 'Not applicable' },
];

export const STOMA_ESCALATION_TYPES: { value: StomaEscalationType; label: string }[] = [
  { value: 'rn', label: 'Registered Nurse' },
  { value: 'gp', label: 'GP' },
  { value: 'on_call', label: 'On-call' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'not_yet', label: 'Not yet (reason required)' },
];

export const CHANGE_REASONS: { value: ChangeReason; label: string }[] = [
  { value: 'routine', label: 'Routine Change' },
  { value: 'scheduled', label: 'Scheduled Change' },
  { value: 'blockage', label: 'Blockage' },
  { value: 'leakage', label: 'Leakage' },
  { value: 'infection', label: 'Suspected Infection' },
  { value: 'malfunction', label: 'Malfunction' },
  { value: 'other', label: 'Other' },
];

export const BAG_CHANGE_REASONS: { value: BagChangeReason; label: string }[] = [
  { value: 'routine', label: 'Routine Change' },
  { value: 'soiled', label: 'Soiled' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'leakage', label: 'Leakage' },
  { value: 'blockage', label: 'Blocked' },
  { value: 'infection_control', label: 'Infection Control' },
  { value: 'other', label: 'Other' },
];

export const BAG_CONDITIONS: { value: BagCondition; label: string }[] = [
  { value: 'clear_urine', label: 'Clear urine' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'sediment', label: 'Sediment present' },
  { value: 'blood_visible', label: 'Blood visible' },
  { value: 'odour', label: 'Odour' },
  { value: 'other', label: 'Other' },
];

export const BAG_CHANGE_FREQUENCY_OPTIONS: { value: BagChangeFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every_x_days', label: 'Every X days' },
  { value: 'prn', label: 'PRN — 2/3 full' },
];

export const FLUSH_SOLUTIONS: { value: FlushSolution; label: string }[] = [
  { value: 'saline', label: 'Saline' },
  { value: 'sterile_water', label: 'Sterile Water' },
  { value: 'other', label: 'Other' },
];

export const FLUSH_FREQUENCIES: { value: FlushFrequency; label: string }[] = [
  { value: 'prn', label: 'PRN (As Needed)' },
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'custom', label: 'Custom Interval' },
];

export const FLUSH_PERFORMERS: { value: FlushPerformer; label: string }[] = [
  { value: 'rn', label: 'Registered Nurse' },
  { value: 'support_worker', label: 'Support Worker (delegated scope)' },
];

export const FLUSH_REASONS: { value: FlushReason; label: string }[] = [
  { value: 'routine', label: 'Routine Flush' },
  { value: 'low_output', label: 'Low output' },
  { value: 'sediment', label: 'Sediment' },
  { value: 'blockage_risk', label: 'Blockage risk' },
  { value: 'urology_plan', label: 'As per urology plan' },
  { value: 'other', label: 'Other' },
];

export const URINE_APPEARANCES: { value: UrineAppearance; label: string }[] = [
  { value: 'clear', label: 'Clear' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'blood', label: 'Blood present' },
  { value: 'sediment', label: 'Sediment present' },
];

export const FLOW_AFTER_FLUSH_OPTIONS: { value: FlowAfterFlush; label: string }[] = [
  { value: 'improved', label: 'Improved' },
  { value: 'unchanged', label: 'Unchanged' },
  { value: 'worse', label: 'Worse' },
];

export const PERSON_RESPONSE_OPTIONS: { value: PersonResponse; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'pain', label: 'Pain' },
  { value: 'distressed', label: 'Distressed' },
];

export const AD_SYMPTOMS: { value: ADSymptom; label: string }[] = [
  { value: 'headache', label: 'Pounding Headache' },
  { value: 'flushing', label: 'Flushing Above Injury Level' },
  { value: 'sweating', label: 'Sweating' },
  { value: 'nasal_congestion', label: 'Nasal Congestion' },
  { value: 'blurred_vision', label: 'Blurred Vision' },
  { value: 'bradycardia', label: 'Slow Heart Rate' },
  { value: 'hypertension', label: 'High Blood Pressure' },
  { value: 'goosebumps', label: 'Goosebumps' },
  { value: 'anxiety', label: 'Anxiety' },
];

export const AD_ACTIONS: { value: ADAction; label: string }[] = [
  { value: 'sit_upright', label: 'Sat person upright' },
  { value: 'loosen_clothing', label: 'Loosened tight clothing' },
  { value: 'check_catheter', label: 'Checked catheter for blockage/kinks' },
  { value: 'drain_bladder', label: 'Drained bladder' },
  { value: 'call_emergency', label: 'Called emergency services' },
];

export const CHANGE_FREQUENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Daily' },
  { value: 2, label: 'Every 2 days' },
  { value: 3, label: 'Every 3 days' },
  { value: 7, label: 'Weekly' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 21, label: 'Every 3 weeks' },
  { value: 28, label: 'Every 4 weeks' },
  { value: 42, label: 'Every 6 weeks' },
  { value: 56, label: 'Every 8 weeks' },
  { value: 84, label: 'Every 12 weeks' },
];

export const FLUSH_FREQUENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 12, label: 'Every 12 hours' },
  { value: 24, label: 'Every 24 hours' },
  { value: 48, label: 'Every 48 hours' },
  { value: 72, label: 'Every 72 hours' },
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
