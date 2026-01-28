/**
 * Weight & BMI Monitoring Types
 */

export type MonitoringFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type HeightMethod = 'standing' | 'arm_span' | 'knee_height' | 'demispan' | 'historical' | 'unknown';
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type MealTiming = 'before_meal' | 'after_meal';
export type WheelchairContext = 'with_wheelchair' | 'without_wheelchair';
export type WeightAlertType = 'overdue_measurement' | 'outside_target_range' | 'rapid_weight_change' | 'bmi_underweight' | 'bmi_obese';
export type AlertSeverity = 'amber' | 'red';

export interface WeightBmiConfig {
  id: string;
  client_id: string | null;
  baseline_weight_kg: number | null;
  monitoring_frequency: MonitoringFrequency;
  min_target_weight_kg: number | null;
  max_target_weight_kg: number | null;
  target_range_alert_severity: AlertSeverity;
  enable_rapid_change_alert: boolean;
  rapid_change_threshold_kg: number;
  rapid_change_window_days: number;
  height_cm: number | null;
  height_method: HeightMethod;
  height_is_estimate: boolean;
  height_method_notes: string | null;
  knee_height_cm: number | null;
  knee_height_sex: 'male' | 'female' | 'unknown' | null;
  enable_trend_graph: boolean;
  escalation_recipients: string[];
  overdue_escalation_cycles: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface WeightEntry {
  id: string;
  client_id: string | null;
  weight_kg: number;
  event_occurred_at: string;
  bmi_value: number | null;
  bmi_category: BmiCategory | null;
  height_used_cm: number | null;
  time_of_day: TimeOfDay | null;
  meal_timing: MealTiming | null;
  wheelchair_context: WheelchairContext | null;
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

export interface WeightBmiAlert {
  id: string;
  client_id: string | null;
  alert_type: WeightAlertType;
  severity: AlertSeverity;
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

export interface WeightStatusInfo {
  status: 'stable' | 'monitor' | 'action';
  statusLabel: string;
  message: string;
  currentWeight: number | null;
  bmiValue: number | null;
  bmiCategory: BmiCategory | null;
  lastRecordedDate: string | null;
  nextDueDate: string | null;
  isOverdue: boolean;
  daysUntilDue: number | null;
  activeAlerts: WeightBmiAlert[];
}

// Height method display labels
export const HEIGHT_METHOD_LABELS: Record<HeightMethod, string> = {
  standing: 'Standing Measurement',
  arm_span: 'Arm Span Estimate',
  knee_height: 'Knee Height Calculation',
  demispan: 'Demispan (Half Arm Span)',
  historical: 'Historical / Medical Record',
  unknown: 'Unknown'
};

// BMI category display config
export const BMI_CATEGORY_CONFIG: Record<BmiCategory, { label: string; color: string }> = {
  underweight: { label: 'Underweight', color: 'text-amber-600' },
  normal: { label: 'Normal', color: 'text-green-600' },
  overweight: { label: 'Overweight', color: 'text-amber-600' },
  obese: { label: 'Obese', color: 'text-red-600' }
};

// Frequency display labels
export const FREQUENCY_LABELS: Record<MonitoringFrequency, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly'
};

// Frequency in days
export const FREQUENCY_DAYS: Record<MonitoringFrequency, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30
};
