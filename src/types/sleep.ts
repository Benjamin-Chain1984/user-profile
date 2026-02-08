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
  max_sleep_threshold_hours: number;
  consecutive_excessive_sleep_trigger: number;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface AwakeningEvent {
  id: string;
  time?: string;
  duration_category: AwakePeriodLength;
  reason?: AwakeningReason;
  reason_other_text?: string;
}

export type AwakeningReason = 'toilet' | 'pain' | 'behaviour' | 'seizure' | 'unknown' | 'other';

export interface SleepEntry {
  id: string;
  client_id: string | null;
  bedtime: string;
  wake_time: string;
  estimated_hours_slept: number;
  /** @deprecated Use awakening_events instead */
  number_of_awakenings: number;
  /** @deprecated Use awakening_events instead */
  awake_period_length: AwakePeriodLength | null;
  awakening_events: AwakeningEvent[];
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

export const AWAKENING_REASONS = [
  { value: 'toilet', label: 'Toilet' },
  { value: 'pain', label: 'Pain' },
  { value: 'behaviour', label: 'Behaviour' },
  { value: 'seizure', label: 'Seizure' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'other', label: 'Other' },
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
  max_sleep_threshold_hours: 12,
  consecutive_excessive_sleep_trigger: 2,
  escalation_recipients: [],
};

/** Estimate total awake minutes from awakening events */
export function estimateAwakeMinutes(events: AwakeningEvent[]): number {
  return events.reduce((total, e) => {
    switch (e.duration_category) {
      case 'less_than_10': return total + 5;
      case '10_to_30': return total + 20;
      case '30_plus': return total + 40;
      default: return total;
    }
  }, 0);
}

/** Get awakening count from entry (supports both old and new format) */
export function getAwakeningCount(entry: SleepEntry): number {
  if (entry.awakening_events && entry.awakening_events.length > 0) {
    return entry.awakening_events.length;
  }
  return entry.number_of_awakenings ?? 0;
}

/** Check if entry has prolonged awakenings (>30 min) */
export function hasProlongedAwakenings(entry: SleepEntry): boolean {
  if (entry.awakening_events && entry.awakening_events.length > 0) {
    return entry.awakening_events.some(e => e.duration_category === '30_plus');
  }
  return entry.awake_period_length === '30_plus';
}

/** Count prolonged awakenings */
export function countProlongedAwakenings(entry: SleepEntry): number {
  if (entry.awakening_events && entry.awakening_events.length > 0) {
    return entry.awakening_events.filter(e => e.duration_category === '30_plus').length;
  }
  return entry.awake_period_length === '30_plus' ? entry.number_of_awakenings : 0;
}
