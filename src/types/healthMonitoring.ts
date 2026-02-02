/**
 * Health Monitoring Module Types
 */

// Vital sign types
export type VitalType = 'temperature' | 'bp_systolic' | 'bp_diastolic' | 'oxygen' | 'heart_rate' | 'respiratory';
export type VitalStatus = 'ideal' | 'amber' | 'red';

// Standard clinical thresholds
export const VITAL_THRESHOLDS: Record<VitalType, { 
  green: { min: number; max: number };
  amberLow?: { min: number; max: number };
  amberHigh?: { min: number; max: number };
  unit: string;
  label: string;
  step: number;
  defaultValue: number;
}> = {
  temperature: {
    green: { min: 36.0, max: 37.5 },
    amberLow: { min: 35.1, max: 35.9 },
    amberHigh: { min: 37.6, max: 38.4 },
    unit: '°C',
    label: 'Temperature',
    step: 0.1,
    defaultValue: 36.8,
  },
  bp_systolic: {
    green: { min: 110, max: 140 },
    amberLow: { min: 90, max: 109 },
    amberHigh: { min: 141, max: 159 },
    unit: 'mmHg',
    label: 'Systolic BP',
    step: 1,
    defaultValue: 120,
  },
  bp_diastolic: {
    green: { min: 70, max: 90 },
    amberLow: { min: 60, max: 69 },
    amberHigh: { min: 91, max: 99 },
    unit: 'mmHg',
    label: 'Diastolic BP',
    step: 1,
    defaultValue: 80,
  },
  oxygen: {
    green: { min: 95, max: 100 },
    amberLow: { min: 91, max: 94 },
    unit: '%',
    label: 'Oxygen Saturation (SpO₂)',
    step: 1,
    defaultValue: 98,
  },
  heart_rate: {
    green: { min: 50, max: 100 },
    amberLow: { min: 40, max: 49 },
    amberHigh: { min: 101, max: 130 },
    unit: 'bpm',
    label: 'Heart Rate',
    step: 1,
    defaultValue: 72,
  },
  respiratory: {
    green: { min: 12, max: 20 },
    amberLow: { min: 9, max: 11 },
    amberHigh: { min: 21, max: 24 },
    unit: 'breaths/min',
    label: 'Respiratory Rate',
    step: 1,
    defaultValue: 16,
  },
};

// Symptoms that can be logged alongside vitals
export const VITAL_SYMPTOMS = [
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'confusion', label: 'Confusion' },
  { id: 'sweating', label: 'Sweating' },
  { id: 'shortness_of_breath', label: 'Shortness of breath' },
  { id: 'pain', label: 'Pain' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue', label: 'Fatigue' },
] as const;

export type SymptomId = typeof VITAL_SYMPTOMS[number]['id'];

// Vital sign entry
export interface VitalSignEntry {
  id: string;
  client_id: string | null;
  temperature_celsius: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  oxygen_saturation: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature_status: VitalStatus | null;
  bp_status: VitalStatus | null;
  oxygen_status: VitalStatus | null;
  heart_rate_status: VitalStatus | null;
  respiratory_status: VitalStatus | null;
  overall_status: VitalStatus;
  symptoms: string[];
  notes: string | null;
  event_occurred_at: string;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
  recorded_on_behalf_of_name: string | null;
  recorded_on_behalf_of_role: string | null;
  recorded_on_behalf_of_reason: string | null;
}

// Configuration
export interface VitalSignConfig {
  id: string;
  client_id: string | null;
  temperature_frequency_hours: number | null;
  bp_frequency_hours: number | null;
  oxygen_frequency_hours: number | null;
  heart_rate_frequency_hours: number | null;
  respiratory_frequency_hours: number | null;
  temperature_enabled: boolean;
  bp_enabled: boolean;
  oxygen_enabled: boolean;
  heart_rate_enabled: boolean;
  respiratory_enabled: boolean;
  amber_recheck_hours: number;
  escalation_recipients: string[];
  enable_log_on_behalf: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Altered criteria for custom thresholds
export interface AlteredCriteria {
  id: string;
  client_id: string;
  vital_type: VitalType;
  green_min: number | null;
  green_max: number | null;
  amber_low_min: number | null;
  amber_low_max: number | null;
  amber_high_min: number | null;
  amber_high_max: number | null;
  confirmed_by_medical_professional: boolean;
  medical_professional_name: string | null;
  medical_professional_role: string | null;
  confirmation_date: string | null;
  clinical_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Alerts
export interface VitalSignAlert {
  id: string;
  client_id: string | null;
  vital_entry_id: string | null;
  alert_type: string;
  vital_type: VitalType | null;
  severity: 'amber' | 'red';
  message: string;
  recommended_action: string | null;
  is_trend_alert: boolean;
  trend_data: Record<string, unknown> | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_reason: string | null;
  action_taken: string | null;
  emergency_services_contacted: boolean;
  emergency_contact_time: string | null;
  outcome: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

// Action logs for documenting responses
export interface VitalSignActionLog {
  id: string;
  client_id: string | null;
  alert_id: string | null;
  vital_entry_id: string | null;
  action_type: 'recheck' | 'escalate' | 'emergency_call' | 'gp_contacted' | 'advice_followed';
  action_description: string;
  contacted_person: string | null;
  contact_role: string | null;
  contact_time: string | null;
  advice_received: string | null;
  outcome: string | null;
  follow_up_required: boolean;
  follow_up_due_at: string | null;
  event_occurred_at: string;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

// Status info for dashboard
export interface HealthMonitoringStatusInfo {
  status: VitalStatus;
  message: string;
  latestEntry: VitalSignEntry | null;
  activeAlerts: VitalSignAlert[];
  vitalStatuses: Record<VitalType, VitalStatus | null>;
}

// On-behalf-of reasons (reuse from bowel care)
export const ON_BEHALF_REASONS = [
  { value: 'forgot_login', label: 'Forgot to log in' },
  { value: 'not_registered', label: 'Not a registered user' },
  { value: 'retrospective', label: 'Retrospective entry' },
  { value: 'other', label: 'Other' },
] as const;

export const STAFF_ROLES = [
  { value: 'support_worker', label: 'Support Worker' },
  { value: 'agency_staff', label: 'Agency Staff' },
  { value: 'family', label: 'Family Member' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'other', label: 'Other' },
] as const;

// Medical professional roles for altered criteria
export const MEDICAL_PROFESSIONAL_ROLES = [
  { value: 'gp', label: 'General Practitioner (GP)' },
  { value: 'specialist', label: 'Specialist Doctor' },
  { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
  { value: 'registered_nurse', label: 'Registered Nurse' },
  { value: 'other', label: 'Other Medical Professional' },
] as const;
