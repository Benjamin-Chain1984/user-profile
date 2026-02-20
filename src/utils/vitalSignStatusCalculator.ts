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
 * Check if any enabled vitals are overdue based on config frequency settings.
 * Returns the earliest overdue vital label, or null if all are on schedule.
 */
export function getOverdueVitals(
  entries: VitalSignEntry[],
  config: {
    temperature_enabled?: boolean;
    temperature_frequency_hours?: number | null;
    bp_enabled?: boolean;
    bp_frequency_hours?: number | null;
    oxygen_enabled?: boolean;
    oxygen_frequency_hours?: number | null;
    heart_rate_enabled?: boolean;
    heart_rate_frequency_hours?: number | null;
    respiratory_enabled?: boolean;
    respiratory_frequency_hours?: number | null;
  } | null
): string[] {
  if (!config) return [];

  const now = Date.now();
  const overdue: string[] = [];

  const check = (
    enabled: boolean | undefined,
    frequencyHours: number | null | undefined,
    label: string,
    latestValue: (e: VitalSignEntry) => number | null
  ) => {
    if (!enabled || !frequencyHours) return;
    const deadlineMs = frequencyHours * 60 * 60 * 1000;
    const latestEntry = entries.find(e => latestValue(e) !== null);
    if (!latestEntry) {
      overdue.push(label);
      return;
    }
    const lastTime = new Date(latestEntry.event_occurred_at).getTime();
    if (now - lastTime > deadlineMs) {
      overdue.push(label);
    }
  };

  check(config.temperature_enabled, config.temperature_frequency_hours, 'Temperature', e => e.temperature_celsius);
  check(config.bp_enabled, config.bp_frequency_hours, 'Blood Pressure', e => e.bp_systolic);
  check(config.oxygen_enabled, config.oxygen_frequency_hours, 'SpO₂', e => e.oxygen_saturation);
  check(config.heart_rate_enabled, config.heart_rate_frequency_hours, 'Heart Rate', e => e.heart_rate);
  check(config.respiratory_enabled, config.respiratory_frequency_hours, 'Resp. Rate', e => e.respiratory_rate);

  return overdue;
}

/**
 * Calculate health monitoring status from entries and alerts
 */
export function calculateHealthMonitoringStatus(
  entries: VitalSignEntry[],
  alerts: VitalSignAlert[] = [],
  config?: {
    temperature_enabled?: boolean;
    temperature_frequency_hours?: number | null;
    bp_enabled?: boolean;
    bp_frequency_hours?: number | null;
    oxygen_enabled?: boolean;
    oxygen_frequency_hours?: number | null;
    heart_rate_enabled?: boolean;
    heart_rate_frequency_hours?: number | null;
    respiratory_enabled?: boolean;
    respiratory_frequency_hours?: number | null;
  } | null
): {
  status: VitalStatus;
  message: string;
  latestEntry: VitalSignEntry | null;
  vitalStatuses: Record<VitalType, VitalStatus | null>;
  overdueVitals: string[];
} {
  const overdueVitals = getOverdueVitals(entries, config ?? null);

  const buildVitalStatuses = (entry: VitalSignEntry | null) => ({
    temperature: entry?.temperature_status ?? null,
    bp_systolic: entry?.bp_status ?? null,
    bp_diastolic: entry?.bp_status ?? null,
    oxygen: entry?.oxygen_status ?? null,
    heart_rate: entry?.heart_rate_status ?? null,
    respiratory: entry?.respiratory_status ?? null,
  });

  // No entries case
  if (!entries || entries.length === 0) {
    const noEntryMessage = overdueVitals.length > 0
      ? `Observations overdue: ${overdueVitals.join(', ')}`
      : 'No vital sign entries recorded yet';
    return {
      status: 'amber',
      message: noEntryMessage,
      latestEntry: null,
      vitalStatuses: buildVitalStatuses(null),
      overdueVitals,
    };
  }

  const latestEntry = entries[0];

  const hasRedAlerts = alerts.some(a => a.severity === 'red' && !a.resolved_at);
  const hasAmberAlerts = alerts.some(a => a.severity === 'amber' && !a.resolved_at);

  // Active RED alerts always take priority regardless of schedule
  if (hasRedAlerts) {
    return {
      status: 'red',
      message: 'Critical vital signs detected – immediate action required',
      latestEntry,
      vitalStatuses: buildVitalStatuses(latestEntry),
      overdueVitals,
    };
  }

  // Overdue observations trump stale stored vital statuses — checked BEFORE
  // using the stored overall_status which may be days old.
  if (overdueVitals.length > 0) {
    return {
      status: 'amber',
      message: `Observations overdue: ${overdueVitals.join(', ')}`,
      latestEntry,
      vitalStatuses: buildVitalStatuses(latestEntry),
      overdueVitals,
    };
  }

  // Latest entry is current — use its stored status
  if (latestEntry.overall_status === 'red') {
    return {
      status: 'red',
      message: 'Critical vital signs detected – immediate action required',
      latestEntry,
      vitalStatuses: buildVitalStatuses(latestEntry),
      overdueVitals,
    };
  }

  if (hasAmberAlerts || latestEntry.overall_status === 'amber') {
    return {
      status: 'amber',
      message: 'Some vital signs require attention',
      latestEntry,
      vitalStatuses: buildVitalStatuses(latestEntry),
      overdueVitals,
    };
  }

  // All good
  return {
    status: 'ideal',
    message: 'All vital signs within normal range',
    latestEntry,
    vitalStatuses: buildVitalStatuses(latestEntry),
    overdueVitals: [],
  };
}
