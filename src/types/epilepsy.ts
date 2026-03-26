/**
 * Epilepsy & Seizure Monitoring Types
 */

export type EpilepsyStatus = 'ideal' | 'monitor' | 'action';

export type EpilepsyWindowUnit = 'hours' | 'minutes';

export interface EpilepsyConfig {
  id: string;
  client_id: string | null;
  enable_seizure_monitoring: boolean;
  expected_seizure_frequency: string;
  typical_seizure_duration_minutes: number | null;
  rescue_medication_prescribed: boolean;
  rescue_medication_name: string | null;
  rescue_medication_dose: string | null;
  rescue_medication_route: string | null;
  rescue_medication_when: string | null;
  call_000_after_minutes: number;
  cluster_seizure_count: number;
  cluster_seizure_hours: number;
  max_seizures_24h: number;
  duration_threshold_minutes: number;
  // New Amber/Red escalation thresholds
  amber_seizure_count: number;
  amber_seizure_window: number;
  amber_seizure_window_unit: EpilepsyWindowUnit;
  red_seizure_count: number;
  red_seizure_window: number;
  red_seizure_window_unit: EpilepsyWindowUnit;
  escalation_recipients: string[];
  known_seizure_types: string[];
  known_seizure_durations: Record<string, string>;
  known_seizure_triggers: string[];
  known_cluster_seizures: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SeizureEvent {
  id: string;
  client_id: string | null;
  event_occurred_at: string;
  duration_minutes: number;
  duration_seconds: number;
  seizure_category: string;
  seizure_type: string;
  triggers: string[];
  trigger_other: string | null;
  recovery: string[];
  recovery_notes: string | null;
  observation_type: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface SeizureAction {
  id: string;
  client_id: string | null;
  seizure_event_id: string | null;
  action_type: string;
  medication_name: string | null;
  medication_dose: string | null;
  medication_route: string | null;
  time_administered: string | null;
  witness_name: string | null;
  dose_matches_plan: boolean | null;
  dose_change_reason: string | null;
  ambulance_called: boolean;
  ambulance_time_called: string | null;
  ambulance_outcome: string | null;
  total_seizure_duration_minutes: number | null;
  total_recovery_time_minutes: number | null;
  injuries_noted: string | null;
  escalation_completed: boolean;
  post_event_notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface EpilepsyAlert {
  id: string;
  client_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown> | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface EpilepsyEscalationRecord {
  id: string;
  client_id: string | null;
  alert_id: string | null;
  seizure_event_id: string | null;
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

// Seizure type definitions with educational info
export const SEIZURE_TYPES = {
  focal: {
    label: 'Focal (Partial)',
    types: [
      { value: 'focal_aware', label: 'Focal Aware', info: 'Awake but may experience jerking, unusual sensations, or strong emotions.' },
      { value: 'focal_impaired_awareness', label: 'Focal Impaired Awareness', info: 'May stare, seem confused, or repeat movements.' },
      { value: 'focal_to_bilateral', label: 'Focal to Bilateral Tonic-Clonic', info: 'Starts in one area and spreads to full-body shaking.' },
    ],
  },
  generalised: {
    label: 'Generalised',
    types: [
      { value: 'absence', label: 'Absence', info: 'Brief blank stare; may stop speaking briefly.' },
      { value: 'tonic', label: 'Tonic', info: 'Sudden stiffening of muscles.' },
      { value: 'atonic', label: 'Atonic', info: 'Sudden loss of muscle tone (drop seizure).' },
      { value: 'myoclonic', label: 'Myoclonic', info: 'Quick jerking movements.' },
      { value: 'tonic_clonic', label: 'Tonic-Clonic', info: 'Full-body stiffening and rhythmic jerking.' },
    ],
  },
  unknown: {
    label: 'Unknown Onset',
    types: [
      { value: 'unknown', label: 'Seizure – Unsure Type', info: 'Use if the seizure type cannot be identified.' },
    ],
  },
};

export const SEIZURE_TRIGGERS = [
  'Missed medication',
  'Lack of sleep',
  'Stress/anxiety',
  'Illness/fever',
  'Flashing lights',
  'Menstruation',
  'Constipation',
  'Dehydration',
  'Unknown',
  'Other',
];

export const RECOVERY_OPTIONS = [
  'Fully alert within 5 min',
  'Drowsy/slept',
  'Confused/disoriented',
  'Headache',
  'Muscle pain',
  'Needed mobility support',
  'Emotional/upset',
  'Incontinence',
  'Injured (notes required)',
  'Emergency support required',
  'Unknown',
  'Other',
];

export const FREQUENCY_OPTIONS = [
  { value: 'rare', label: 'Rare' },
  { value: 'occasional', label: 'Occasional' },
  { value: 'frequent', label: 'Frequent' },
  { value: 'unknown', label: 'Unknown' },
];

export interface DurationEscalationInfo {
  /** Whether a timed escalation from a duration breach is active */
  isActive: boolean;
  /** The seizure event that triggered it */
  triggerEventDate: string | null;
  /** Current phase: 'red' (0-24h), 'amber' (24-48h), or null (expired) */
  phase: 'red' | 'amber' | null;
  /** Hours remaining in the current phase */
  hoursRemaining: number;
  /** Total hours elapsed since the triggering event */
  hoursElapsed: number;
}

export interface EpilepsyStatusInfo {
  status: EpilepsyStatus;
  message: string;
  daysSinceLastSeizure: number | null;
  lastSeizureDate: string | null;
  activeAlerts: EpilepsyAlert[];
  seizuresInWindow: number;
  amberThreshold: number;
  redThreshold: number;
  windowLabel: string;
  longestDurationInWindow: number;
  durationThreshold: number;
  needsPrnPrompt: boolean;
  durationEscalation: DurationEscalationInfo;
}
