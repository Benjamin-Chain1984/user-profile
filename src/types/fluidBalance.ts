export type FluidStatus = 'ideal' | 'amber' | 'red';

export interface FluidConfig {
  id: string;
  client_id: string | null;
  target_daily_intake_ml: number;
  enable_output_logging: boolean;
  day_boundary_time: string;
  dehydration_threshold_ml: number;
  overhydration_threshold_ml: number;
  // Percentage-based thresholds for status indicators
  dehydration_warning_percent: number; // Default 30% - triggers Amber when below this
  overhydration_warning_percent: number; // Default 120% - triggers Red when above this
  time_checkpoint_for_warning: string; // Default "12:00" - time after which low hydration triggers Amber
  fluid_restriction_enabled: boolean;
  max_fluid_allowance_ml: number | null;
  hard_stop_on_limit_exceeded: boolean;
  escalation_recipients: string[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface FluidIntakeEntry {
  id: string;
  client_id: string | null;
  fluid_type: string;
  amount_ml: number;
  event_occurred_at: string;
  is_self_reported: boolean;
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

export interface FluidOutputEntry {
  id: string;
  client_id: string | null;
  output_type: string;
  amount_ml: number | null;
  is_unmeasured: boolean;
  urine_colour: number | null;
  event_occurred_at: string;
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

export interface HydrationSymptomCheck {
  id: string;
  client_id: string | null;
  check_date: string;
  thirst_dry_mouth: boolean;
  fatigue_dizziness: boolean;
  confusion: boolean;
  swelling: boolean;
  nausea_vomiting: boolean;
  urine_colour: number | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface FluidBalanceAlert {
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

export interface DailySummary {
  date: string;
  totalIntake: number;
  totalOutput: number;
  balance: number;
  percentOfTarget: number;
  status: FluidStatus;
  statusReason: string;
}

export const FLUID_TYPES = [
  'Water',
  'Tea',
  'Coffee',
  'Juice',
  'Soup',
  'Milk',
  'Tube Feed',
  'Other'
] as const;

export const OUTPUT_TYPES = [
  'Urine',
  'Vomit',
  'Drainage',
  'Excessive Sweating',
  'Diarrhoea',
  'Other'
] as const;

export const URINE_COLOUR_SCALE = [
  { value: 1, label: '1 - Clear', color: '#f0f7e6', description: 'Well hydrated' },
  { value: 2, label: '2 - Pale Yellow', color: '#f5f3c2', description: 'Well hydrated' },
  { value: 3, label: '3 - Light Yellow', color: '#f2e88a', description: 'Normal' },
  { value: 4, label: '4 - Yellow', color: '#e8d54c', description: 'Normal' },
  { value: 5, label: '5 - Dark Yellow', color: '#d4b82c', description: 'Mild dehydration' },
  { value: 6, label: '6 - Amber', color: '#c9a227', description: 'Dehydration' },
  { value: 7, label: '7 - Orange', color: '#b8860b', description: 'Significant dehydration' },
  { value: 8, label: '8 - Dark Orange/Brown', color: '#8b4513', description: 'Severe dehydration' }
] as const;
