export type HealthStatus = 'stable' | 'monitor' | 'action';

export type Sex = 'male' | 'female' | 'intersex' | 'prefer_not_to_say';

export interface IndividualProfile {
  id: string;
  avatarUrl?: string;
  fullName: string;
  sex?: Sex;
  dateOfBirth: string;
  personResponsibleName: string;
  relationshipToIndividual: string;
  primaryContactNumber: string;
  secondaryContact?: string;
  email?: string;
  createdAt: string;
  createdBy: string;
  editedAt?: string;
  editedBy?: string;
}

export interface HealthModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status?: HealthStatus;
  lastEntry?: string;
  hasSubModules?: boolean;
}

export interface HealthMonitoringConfig {
  bloodPressureEnabled: boolean;
  heartRateEnabled: boolean;
  oxygenLevelsEnabled: boolean;
  temperatureEnabled: boolean;
  respiratoryRateEnabled: boolean;
}

export interface Alert {
  id: string;
  moduleId: string;
  moduleName: string;
  message: string;
  status: 'amber' | 'red';
  timestamp: string;
}

export interface GlobalAlertState {
  currentStatus: HealthStatus;
  activeAlertsCount: number;
  alerts: Alert[];
}

export const HEALTH_MODULES: Omit<HealthModule, 'enabled' | 'status' | 'lastEntry'>[] = [
  { id: 'constipation', name: 'Bowel Care', description: 'Track bowel movements and patterns' },
  { id: 'catheter', name: 'Urinary Catheter Management', description: 'Catheter care and monitoring' },
  { id: 'continence', name: 'Continence Management', description: 'Monitor pad changes and skin integrity' },
  { id: 'diabetes', name: 'Diabetes', description: 'Blood glucose monitoring and management' },
  { id: 'enteral', name: 'Enteral Nutrition', description: 'Tube feeding management and tracking' },
  { id: 'epilepsy', name: 'Epilepsy & Seizures', description: 'Seizure tracking and patterns' },
  { id: 'fluid-balance', name: 'Fluid Balance & Hydration', description: 'Daily fluid intake, output, and hydration monitoring' },
  { id: 'health-monitoring', name: 'Health Monitoring', description: 'Vital signs tracking', hasSubModules: true },
  { id: 'health-prevention', name: 'Health Prevention', description: 'Preventative health assessments and checks' },
  { id: 'iddsi', name: 'IDDSI Levels', description: 'Food and drink texture management' },
  { id: 'oral-health', name: 'Oral Health Care', description: 'Dental and oral hygiene tracking' },
  { id: 'ostomy', name: 'Ostomy (Stoma Care)', description: 'Stoma output and care management' },
  { id: 'pain-check', name: 'Pain Assessment', description: 'Pain assessment and monitoring' },
  { id: 'pressure-area', name: 'Pressure Area Prevention', description: 'Skin integrity and repositioning' },
  { id: 'sleep', name: 'Sleep Chart', description: 'Sleep patterns and quality tracking' },
  { id: 'weight', name: 'Weight & BMI Monitoring', description: 'Weight tracking, BMI calculation, and trends' },
];

export const HEALTH_MONITORING_VITALS = [
  { id: 'blood-pressure', name: 'Blood Pressure', icon: 'Heart' },
  { id: 'heart-rate', name: 'Heart Rate', icon: 'Activity' },
  { id: 'oxygen-levels', name: 'Oxygen Levels (SpO₂)', icon: 'Wind' },
  { id: 'temperature', name: 'Temperature', icon: 'Thermometer' },
  { id: 'respiratory-rate', name: 'Respiratory Rate', icon: 'Wind' },
];

// Frequency options for vital sign monitoring
export const MONITORING_FREQUENCIES = [
  { value: 'daily', label: 'Daily', hours: 24 },
  { value: 'twice_daily', label: 'Twice Daily', hours: 12 },
  { value: 'weekly', label: 'Weekly', hours: 168 },
  { value: 'monthly', label: 'Monthly', hours: 720 },
  { value: 'as_needed', label: 'As Needed', hours: null },
] as const;

export type MonitoringFrequency = typeof MONITORING_FREQUENCIES[number]['value'];
