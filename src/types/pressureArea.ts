/**
 * Pressure Area Prevention Module Types
 */

export const SCHEDULE_TYPES = ['fixed', 'interval', 'mixed', 'as_required'] as const;
export type ScheduleType = typeof SCHEDULE_TYPES[number];

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  fixed: 'Fixed Times',
  interval: 'Interval-Based',
  mixed: 'Mixed (Fixed + Interval)',
  as_required: 'As Required',
};

export interface RotationPosition {
  id: string;
  name: string;
  target_duration_minutes: number;
  notes: string | null;
  is_custom: boolean;
}

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};
export type WeeklyRotationSequence = Record<DayOfWeek, RotationPosition[]>;

export function emptyWeeklySequence(): WeeklyRotationSequence {
  return { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
}

/** Normalise legacy flat array OR weekly map into a weekly map */
export function normalizeRotationSequence(raw: unknown): WeeklyRotationSequence {
  if (!raw) return emptyWeeklySequence();
  if (Array.isArray(raw)) {
    // Legacy: same positions every day
    const week = emptyWeeklySequence();
    DAYS_OF_WEEK.forEach(d => week[d] = raw);
    return week;
  }
  // Already weekly
  const obj = raw as Record<string, RotationPosition[]>;
  const week = emptyWeeklySequence();
  DAYS_OF_WEEK.forEach(d => { week[d] = obj[d] || []; });
  return week;
}

/** Get positions for a specific day (defaults to today) */
export function getPositionsForDay(seq: WeeklyRotationSequence, day?: DayOfWeek): RotationPosition[] {
  const jsDay = new Date().getDay(); // 0=Sun
  const d = day || DAYS_OF_WEEK[jsDay === 0 ? 6 : jsDay - 1];
  return seq[d] || [];
}

export const DEFAULT_POSITIONS = [
  'Back (supine)',
  'Left side (30° tilt)',
  'Right side (30° tilt)',
  'Chair upright (time-limited)',
  'Wheelchair pressure relief (weight shift)',
] as const;

export const HIGH_RISK_AREAS = [
  { id: 'sacrum_coccyx', label: 'Sacrum / Coccyx' },
  { id: 'heels', label: 'Heels' },
  { id: 'hips', label: 'Hips' },
  { id: 'ischials', label: 'Ischials' },
  { id: 'ankles', label: 'Ankles' },
  { id: 'elbows', label: 'Elbows' },
  { id: 'shoulder_blades', label: 'Shoulder Blades' },
  { id: 'head_ears', label: 'Head / Ears' },
  { id: 'spine', label: 'Spine' },
  { id: 'knees_contractures', label: 'Knees / Contractures' },
  { id: 'skin_folds', label: 'Skin Folds' },
] as const;

export const SKIN_FINDING_TYPES = [
  { id: 'mild_redness', label: 'Mild Redness', severity: 'amber' as const },
  { id: 'blanching_redness', label: 'Blanching Redness', severity: 'amber' as const },
  { id: 'non_blanching_redness', label: 'Non-blanching Redness', severity: 'red' as const },
  { id: 'blister', label: 'Blister', severity: 'red' as const },
  { id: 'broken_skin', label: 'Broken Skin', severity: 'red' as const },
  { id: 'pain', label: 'Increasing Pain', severity: 'red' as const },
  { id: 'discharge', label: 'Discharge', severity: 'red' as const },
] as const;

export const RELIEF_ISSUES = [
  'Refused',
  'Pain/discomfort',
  'Unsafe to move',
  'Equipment unavailable',
  'Other',
] as const;

export const SKIN_CHECK_FREQUENCIES = ['daily', 'twice_daily', 'three_times_daily', 'every_reposition', 'custom'] as const;
export type SkinCheckFrequency = typeof SKIN_CHECK_FREQUENCIES[number];
export const SKIN_CHECK_FREQUENCY_LABELS: Record<SkinCheckFrequency, string> = {
  daily: 'Once Per Day',
  twice_daily: 'Twice Per Day',
  three_times_daily: 'Three Times Per Day',
  every_reposition: 'Every Reposition',
  custom: 'Custom',
};

export function skinCheckTimesPerDay(freq: SkinCheckFrequency, customCount?: number): number {
  switch (freq) {
    case 'daily': return 1;
    case 'twice_daily': return 2;
    case 'three_times_daily': return 3;
    case 'every_reposition': return -1; // dynamic, tied to reposition schedule
    case 'custom': return customCount || 1;
  }
}

export interface SkinCheckAreaSchedule {
  enabled: boolean;
  frequency: SkinCheckFrequency;
  custom_times_per_day?: number;
}

export type SkinCheckSchedule = Record<string, SkinCheckAreaSchedule>;

export interface PressureReliefPlan {
  id: string;
  client_id: string | null;
  status: 'draft' | 'published';
  version: number;
  plan_author: string | null;
  plan_author_email: string | null;
  plan_author_phone: string | null;
  date_developed: string | null;
  last_reviewed_date: string | null;
  next_review_due: string | null;
  schedule_type: ScheduleType;
  day_schedule_start: string;
  day_schedule_end: string;
  night_schedule_start: string | null;
  night_schedule_end: string | null;
  interval_minutes: number;
  rotation_sequence: WeeklyRotationSequence;
  high_risk_areas: string[];
  escalation_rules: Record<string, unknown>;
  overdue_amber_minutes: number;
  overdue_red_minutes: number;
  skin_check_schedule: SkinCheckSchedule;
  additional_instructions: string | null;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PressureReliefEvent {
  id: string;
  client_id: string | null;
  position_completed: string;
  position_recommended: string | null;
  event_occurred_at: string;
  issues: string[];
  issue_details: string | null;
  escalation_required: boolean;
  escalation_contact: string | null;
  escalation_advice: string | null;
  notes: string | null;
  completed_by_name: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface SkinCheckSession {
  id: string;
  client_id: string | null;
  overall_status: 'healthy' | 'amber' | 'red';
  notes: string | null;
  event_occurred_at: string;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface SkinFindingMarker {
  id: string;
  session_id: string;
  location: string;
  finding_type: string;
  severity: 'amber' | 'red';
  x_percent: number | null;
  y_percent: number | null;
  notes: string | null;
  created_at: string;
}

export interface PressureAreaConfig {
  id: string;
  client_id: string | null;
  enable_compliance_scoring: boolean;
  skin_check_frequency_days: number;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export type PressureAreaStatus = 'ideal' | 'monitor' | 'action';

export interface PressureAreaStatusInfo {
  status: PressureAreaStatus;
  message: string;
  lastEntry: string;
  compliancePercent?: number;
}
