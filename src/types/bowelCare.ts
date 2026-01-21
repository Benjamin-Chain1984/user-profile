/**
 * Bowel Care Module Types
 */

export interface BowelCareConfig {
  id: string;
  client_id: string | null;
  no_bm_days_threshold: number;
  type1_consecutive_days_threshold: number;
  monitor_hours_after_prn: number;
  no_bm_after_prn_hours_escalation: number;
  prn_dose_lookback_window_hours: number;
  max_prn_doses_in_window: number;
  max_prn_doses_per_24h: number;
  diarrhoea_type67_count_threshold: number;
  diarrhoea_hours_window: number;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PrnMedication {
  id: string;
  client_id: string | null;
  medication_name: string;
  dose_instructions: string;
  route: 'oral' | 'peg' | 'rectal' | 'other' | null;
  notes: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface BowelLogEntry {
  id: string;
  client_id: string | null;
  bristol_type: number; // 0-7
  stool_size: 'small' | 'normal' | 'large' | 'unknown' | null;
  observed_status: 'observed' | 'self_reported' | 'not_observed';
  indicators: BowelIndicators;
  notes: string | null;
  entry_time: string;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface BowelIndicators {
  pain?: 'none' | 'mild' | 'moderate' | 'severe';
  straining?: boolean;
  blood?: 'none' | 'bright_red' | 'dark_tarry';
  mucus?: boolean;
  stool_colour?: 'normal' | 'black' | 'pale' | 'greasy';
  vomiting?: boolean;
  bloating?: boolean;
  abdominal_pain?: 'none' | 'mild' | 'moderate' | 'severe';
}

export interface PrnAdministration {
  id: string;
  client_id: string | null;
  medication_id: string | null;
  medication_name: string;
  dose_given: string;
  administration_time: string;
  prior_bristol_type: number | null;
  monitoring_end_time: string | null;
  bowel_motion_occurred: boolean | null;
  outcome_recorded_at: string | null;
  outcome_bristol_type: number | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface BowelCareAlert {
  id: string;
  client_id: string | null;
  alert_type: 'constipation_threshold' | 'prn_recommended' | 'no_bm_after_prn' | 'prn_limit_reached' | 'diarrhoea' | 'red_flag' | 'immediate_escalation';
  severity: 'amber' | 'red';
  message: string;
  metadata: Record<string, unknown>;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface EscalationRecord {
  id: string;
  client_id: string | null;
  alert_id: string | null;
  escalation_reason: string;
  contacted_person: string;
  contact_role: string | null;
  contact_time: string;
  advice_received: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

// Bristol Stool Chart definitions
export const BRISTOL_TYPES = [
  { type: 0, name: 'Bowel not opened', description: 'No bowel movement recorded', icon: '⊘' },
  { type: 1, name: 'Hard pellets', description: 'Separate hard lumps, like nuts (hard to pass)', icon: '●●●' },
  { type: 2, name: 'Lumpy sausage', description: 'Sausage-shaped but lumpy', icon: '▬▪' },
  { type: 3, name: 'Cracked sausage', description: 'Like a sausage but with cracks on the surface', icon: '▬' },
  { type: 4, name: 'Smooth sausage', description: 'Like a sausage or snake, smooth and soft', icon: '━' },
  { type: 5, name: 'Soft blobs', description: 'Soft blobs with clear-cut edges (easy to pass)', icon: '◐◐' },
  { type: 6, name: 'Fluffy pieces', description: 'Fluffy pieces with ragged edges, mushy', icon: '☁' },
  { type: 7, name: 'Watery', description: 'Watery, no solid pieces (entirely liquid)', icon: '💧' },
] as const;

export const STOOL_SIZES = [
  { value: 'small', label: 'Small', description: 'Like a grape or walnut', icon: '🍇' },
  { value: 'normal', label: 'Normal', description: 'Like a banana or cucumber', icon: '🍌' },
  { value: 'large', label: 'Large', description: 'Like a sweet potato or zucchini', icon: '🥒' },
  { value: 'unknown', label: 'Unknown', description: 'Not observed or unable to determine', icon: '❓' },
] as const;

export type BowelCareStatus = 'ideal' | 'monitor' | 'action';

export interface BowelCareStatusInfo {
  status: BowelCareStatus;
  message: string;
  daysSinceLastBm: number | null;
  lastBristolType: number | null;
  activeAlerts: BowelCareAlert[];
}
