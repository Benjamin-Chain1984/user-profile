/**
 * Sleep Chart Module Types
 */

export interface SleepConfig {
  id: string;
  client_id: string | null;
  min_expected_sleep_hours: number;
  disruption_threshold: number;
  poor_sleep_threshold_hours: number;
  consecutive_disruption_alert_days: number;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SleepEntry {
  id: string;
  client_id: string | null;
  bedtime: string;
  wake_time: string;
  estimated_hours_slept: number;
  number_of_awakenings: number;
  awake_period_length: AwakePeriodLength | null;
  restlessness: boolean;
  day_nap: boolean;
  day_nap_duration_minutes: number | null;
  day_nap_time: string | null;
  day_nap_behaviour_before: string | null;
  day_nap_notes: string | null;
  assistance_types: string[];
  assistance_other_text: string | null;
  notes: string | null;
  event_occurred_at: string;
  recorded_on_behalf_of_name: string | null;
  recorded_on_behalf_of_role: string | null;
  recorded_on_behalf_of_reason: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface SleepAlert {
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

export type AwakePeriodLength = 'less_than_10' | '10_to_30' | '30_plus';

export type SleepStatus = 'ideal' | 'monitor' | 'action';

export interface SleepStatusInfo {
  status: SleepStatus;
  message: string;
  lastEntry: string;
}

export const AWAKE_PERIOD_OPTIONS = [
  { value: 'less_than_10', label: 'Less than 10 min' },
  { value: '10_to_30', label: '10–30 min' },
  { value: '30_plus', label: '30+ min' },
] as const;

export const ASSISTANCE_TYPES = [
  { value: 'toilet', label: 'Toilet' },
  { value: 'repositioning', label: 'Repositioning' },
  { value: 'behaviour_support', label: 'Behaviour support' },
  { value: 'seizure', label: 'Seizure' },
  { value: 'pain', label: 'Pain' },
  { value: 'other', label: 'Other' },
] as const;

export const DEFAULT_SLEEP_CONFIG: Partial<SleepConfig> = {
  min_expected_sleep_hours: 7,
  disruption_threshold: 3,
  poor_sleep_threshold_hours: 5,
  consecutive_disruption_alert_days: 3,
  escalation_recipients: [],
};
