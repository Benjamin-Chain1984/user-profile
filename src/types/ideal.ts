export type HealthStatus = 'stable' | 'monitor' | 'action';

export interface IndividualProfile {
  id: string;
  avatarUrl?: string;
  fullName: string;
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
  { id: 'constipation', name: 'Constipation', description: 'Track bowel movements and patterns' },
  { id: 'continence', name: 'Continence Management', description: 'Monitor bladder and bowel control' },
  { id: 'diabetes', name: 'Diabetes', description: 'Blood glucose monitoring and management' },
  { id: 'enteral', name: 'Enteral Nutrition', description: 'Tube feeding management and tracking' },
  { id: 'epilepsy', name: 'Epilepsy & Seizures', description: 'Seizure tracking and patterns' },
  { id: 'fluid-balance', name: 'Fluid Balance', description: 'Daily fluid intake and output' },
  { id: 'health-monitoring', name: 'Health Monitoring', description: 'Vital signs tracking', hasSubModules: true },
  { id: 'iddsi', name: 'IDDSI Levels', description: 'Food and drink texture management' },
  { id: 'oral-health', name: 'Oral Health Care', description: 'Dental and oral hygiene tracking' },
  { id: 'ostomy', name: 'Ostomy (Stoma Care)', description: 'Stoma output and care management' },
  { id: 'pain-check', name: 'Pain Check', description: 'Pain assessment and monitoring' },
  { id: 'pressure-area', name: 'Pressure Area Prevention', description: 'Skin integrity and repositioning' },
  { id: 'sleep', name: 'Sleep Chart', description: 'Sleep patterns and quality tracking' },
  { id: 'catheter', name: 'Urinary Catheter Management', description: 'Catheter care and monitoring' },
  { id: 'weight', name: 'Weight', description: 'Weight tracking and trends' },
];

export const HEALTH_MONITORING_VITALS = [
  { id: 'blood-pressure', name: 'Blood Pressure', icon: 'Heart' },
  { id: 'heart-rate', name: 'Heart Rate', icon: 'Activity' },
  { id: 'oxygen-levels', name: 'Oxygen Levels (SpO₂)', icon: 'Wind' },
  { id: 'temperature', name: 'Temperature', icon: 'Thermometer' },
];
