/**
 * Vital Sign Status Calculator - Single Source of Truth
 * 
 * This utility provides the authoritative status calculation for health monitoring.
 * It handles both standard clinical thresholds and altered criteria for individual clients.
 */

import { VITAL_THRESHOLDS, type VitalType, type VitalStatus, type AlteredCriteria, type VitalSignEntry, type VitalSignAlert } from '@/types/healthMonitoring';

interface ThresholdRange {
  green: { min: number; max: number };
  amberLow?: { min: number; max: number };
  amberHigh?: { min: number; max: number };
}

// Simplified threshold overrides for UI components
export interface PartialThresholdOverride {
  green_min?: number | null;
  green_max?: number | null;
  amber_low_min?: number | null;
  amber_low_max?: number | null;
  amber_high_min?: number | null;
  amber_high_max?: number | null;
}

/**
 * Get effective thresholds for a vital type, considering altered criteria
 */
export function getEffectiveThresholds(
  vitalType: VitalType,
  alteredCriteria?: AlteredCriteria | null
): ThresholdRange {
  const standard = VITAL_THRESHOLDS[vitalType];
  
  // If no altered criteria or not active, use standard thresholds
  if (!alteredCriteria || !alteredCriteria.is_active || !alteredCriteria.confirmed_by_medical_professional) {
    return {
      green: standard.green,
      amberLow: standard.amberLow,
      amberHigh: standard.amberHigh,
    };
  }

  // Use altered criteria where specified, fall back to standard
  return {
    green: {
      min: alteredCriteria.green_min ?? standard.green.min,
      max: alteredCriteria.green_max ?? standard.green.max,
    },
    amberLow: alteredCriteria.amber_low_min !== null && alteredCriteria.amber_low_max !== null
      ? { min: alteredCriteria.amber_low_min, max: alteredCriteria.amber_low_max }
      : standard.amberLow,
    amberHigh: alteredCriteria.amber_high_min !== null && alteredCriteria.amber_high_max !== null
      ? { min: alteredCriteria.amber_high_min, max: alteredCriteria.amber_high_max }
      : standard.amberHigh,
  };
}

/**
 * Calculate status for a single vital value
 * Accepts either full AlteredCriteria or simplified PartialThresholdOverride
 */
export function calculateVitalStatus(
  value: number | null,
  vitalType: VitalType,
  alteredCriteria?: AlteredCriteria | PartialThresholdOverride | null
): VitalStatus | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Convert partial override to threshold range if needed
  let thresholds: ThresholdRange;
  
  if (alteredCriteria && 'is_active' in alteredCriteria) {
    // Full AlteredCriteria type
    thresholds = getEffectiveThresholds(vitalType, alteredCriteria);
  } else if (alteredCriteria) {
    // PartialThresholdOverride type
    const standard = VITAL_THRESHOLDS[vitalType];
    thresholds = {
      green: {
        min: alteredCriteria.green_min ?? standard.green.min,
        max: alteredCriteria.green_max ?? standard.green.max,
      },
      amberLow: alteredCriteria.amber_low_min !== undefined && alteredCriteria.amber_low_max !== undefined
        ? { min: alteredCriteria.amber_low_min ?? standard.amberLow?.min ?? 0, max: alteredCriteria.amber_low_max ?? standard.amberLow?.max ?? 0 }
        : standard.amberLow,
      amberHigh: alteredCriteria.amber_high_min !== undefined && alteredCriteria.amber_high_max !== undefined
        ? { min: alteredCriteria.amber_high_min ?? standard.amberHigh?.min ?? 0, max: alteredCriteria.amber_high_max ?? standard.amberHigh?.max ?? 0 }
        : standard.amberHigh,
    };
  } else {
    thresholds = getEffectiveThresholds(vitalType, null);
  }

  // Check green (IDEAL) range first
  if (value >= thresholds.green.min && value <= thresholds.green.max) {
    return 'ideal';
  }

  // Check amber ranges
  if (thresholds.amberLow && value >= thresholds.amberLow.min && value <= thresholds.amberLow.max) {
    return 'amber';
  }
  if (thresholds.amberHigh && value >= thresholds.amberHigh.min && value <= thresholds.amberHigh.max) {
    return 'amber';
  }

  // Anything outside amber ranges is red
  return 'red';
}

/**
 * Calculate BP status using "worst wins" logic
 * Accepts either full AlteredCriteria or simplified PartialThresholdOverride
 */
export function calculateBpStatus(
  systolic: number | null,
  diastolic: number | null,
  systolicCriteria?: AlteredCriteria | PartialThresholdOverride | null,
  diastolicCriteria?: AlteredCriteria | PartialThresholdOverride | null
): VitalStatus | null {
  const systolicStatus = calculateVitalStatus(systolic, 'bp_systolic', systolicCriteria);
  const diastolicStatus = calculateVitalStatus(diastolic, 'bp_diastolic', diastolicCriteria);

  // If both are null, return null
  if (systolicStatus === null && diastolicStatus === null) {
    return null;
  }

  // Worst wins: red > amber > ideal
  const statuses = [systolicStatus, diastolicStatus].filter((s): s is VitalStatus => s !== null);
  
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('amber')) return 'amber';
  return 'ideal';
}

/**
 * Calculate overall status from all vitals
 */
export function calculateOverallStatus(statuses: (VitalStatus | null)[]): VitalStatus {
  const nonNullStatuses = statuses.filter((s): s is VitalStatus => s !== null);
  
  if (nonNullStatuses.length === 0) return 'ideal';
  if (nonNullStatuses.includes('red')) return 'red';
  if (nonNullStatuses.includes('amber')) return 'amber';
  return 'ideal';
}

/**
 * Calculate all statuses for a vital sign entry
 */
export function calculateEntryStatuses(
  entry: Partial<VitalSignEntry>,
  alteredCriteria: Record<VitalType, AlteredCriteria | null> = {} as Record<VitalType, AlteredCriteria | null>
): {
  temperature_status: VitalStatus | null;
  bp_status: VitalStatus | null;
  oxygen_status: VitalStatus | null;
  heart_rate_status: VitalStatus | null;
  respiratory_status: VitalStatus | null;
  overall_status: VitalStatus;
} {
  const temperatureStatus = calculateVitalStatus(
    entry.temperature_celsius ?? null,
    'temperature',
    alteredCriteria.temperature
  );

  const bpStatus = calculateBpStatus(
    entry.bp_systolic ?? null,
    entry.bp_diastolic ?? null,
    alteredCriteria.bp_systolic,
    alteredCriteria.bp_diastolic
  );

  const oxygenStatus = calculateVitalStatus(
    entry.oxygen_saturation ?? null,
    'oxygen',
    alteredCriteria.oxygen
  );

  const heartRateStatus = calculateVitalStatus(
    entry.heart_rate ?? null,
    'heart_rate',
    alteredCriteria.heart_rate
  );

  const respiratoryStatus = calculateVitalStatus(
    entry.respiratory_rate ?? null,
    'respiratory',
    alteredCriteria.respiratory
  );

  const overallStatus = calculateOverallStatus([
    temperatureStatus,
    bpStatus,
    oxygenStatus,
    heartRateStatus,
    respiratoryStatus,
  ]);

  return {
    temperature_status: temperatureStatus,
    bp_status: bpStatus,
    oxygen_status: oxygenStatus,
    heart_rate_status: heartRateStatus,
    respiratory_status: respiratoryStatus,
    overall_status: overallStatus,
  };
}

/**
 * Get color class for a status
 */
export function getStatusColor(status: VitalStatus | null): string {
  switch (status) {
    case 'red':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'amber':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'ideal':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: VitalStatus | null): string {
  switch (status) {
    case 'red':
      return 'Red – Action Needed';
    case 'amber':
      return 'Amber – Attention Required';
    case 'ideal':
      return 'IDEAL';
    default:
      return 'Not recorded';
  }
}

/**
 * Get alert message based on vital and status
 */
export function getAlertMessage(
  vitalType: VitalType,
  value: number,
  status: VitalStatus,
  isAltered: boolean = false
): string {
  const threshold = VITAL_THRESHOLDS[vitalType];
  const alteredNote = isAltered ? ' (using altered criteria)' : '';
  
  if (status === 'red') {
    return `${threshold.label} at ${value}${threshold.unit} is critical${alteredNote}`;
  }
  if (status === 'amber') {
    return `${threshold.label} at ${value}${threshold.unit} requires monitoring${alteredNote}`;
  }
  return `${threshold.label} is within normal range${alteredNote}`;
}

/**
 * Calculate health monitoring status from entries and alerts
 */
export function calculateHealthMonitoringStatus(
  entries: VitalSignEntry[],
  alerts: VitalSignAlert[] = []
): {
  status: VitalStatus;
  message: string;
  latestEntry: VitalSignEntry | null;
  vitalStatuses: Record<VitalType, VitalStatus | null>;
} {
  // No entries case
  if (!entries || entries.length === 0) {
    return {
      status: 'amber',
      message: 'No vital sign entries recorded yet',
      latestEntry: null,
      vitalStatuses: {
        temperature: null,
        bp_systolic: null,
        bp_diastolic: null,
        oxygen: null,
        heart_rate: null,
        respiratory: null,
      },
    };
  }

  const latestEntry = entries[0];
  
  // Check for active red alerts
  const hasRedAlerts = alerts.some(a => a.severity === 'red' && !a.resolved_at);
  if (hasRedAlerts || latestEntry.overall_status === 'red') {
    return {
      status: 'red',
      message: 'Critical vital signs detected – immediate action required',
      latestEntry,
      vitalStatuses: {
        temperature: latestEntry.temperature_status,
        bp_systolic: latestEntry.bp_status,
        bp_diastolic: latestEntry.bp_status,
        oxygen: latestEntry.oxygen_status,
        heart_rate: latestEntry.heart_rate_status,
        respiratory: latestEntry.respiratory_status,
      },
    };
  }

  // Check for amber status
  const hasAmberAlerts = alerts.some(a => a.severity === 'amber' && !a.resolved_at);
  if (hasAmberAlerts || latestEntry.overall_status === 'amber') {
    return {
      status: 'amber',
      message: 'Some vital signs require attention',
      latestEntry,
      vitalStatuses: {
        temperature: latestEntry.temperature_status,
        bp_systolic: latestEntry.bp_status,
        bp_diastolic: latestEntry.bp_status,
        oxygen: latestEntry.oxygen_status,
        heart_rate: latestEntry.heart_rate_status,
        respiratory: latestEntry.respiratory_status,
      },
    };
  }

  // All good
  return {
    status: 'ideal',
    message: 'All vital signs within normal range',
    latestEntry,
    vitalStatuses: {
      temperature: latestEntry.temperature_status,
      bp_systolic: latestEntry.bp_status,
      bp_diastolic: latestEntry.bp_status,
      oxygen: latestEntry.oxygen_status,
      heart_rate: latestEntry.heart_rate_status,
      respiratory: latestEntry.respiratory_status,
    },
  };
}
