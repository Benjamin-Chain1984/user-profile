/**
 * computeHealthMonitoringStatus — Authoritative, config-driven status engine
 * for Health Monitoring overdue detection.
 *
 * RULES:
 *  - Config is MANDATORY. Missing config → Amber + "Config missing" message.
 *  - Frequency mapping: Daily=24h, Twice Daily=12h, Three Times Daily=8h,
 *    Weekly=168h, Twice Weekly=84h; raw hours also accepted directly.
 *  - Per-vital overdue: if enabled + lastRecordedAt > expectedInterval → Amber.
 *  - Status hierarchy: Red > Amber > Ideal (Green).
 *  - BP overdue uses the BP event timestamp (systolic & diastolic are one event).
 *  - Timezone-aware: all comparisons done in UTC ms; "now" is injected for testability.
 */

import type { VitalSignEntry, VitalSignConfig, VitalSignAlert, VitalType, VitalStatus } from '@/types/healthMonitoring';
import { calculateEntryStatuses } from '@/utils/vitalSignStatusCalculator';
import type { AlteredCriteria } from '@/types/healthMonitoring';

// ─── Frequency mapping ────────────────────────────────────────────────────────

/** Map frequency_hours number to human-readable label */
export function frequencyLabel(hours: number): string {
  if (hours <= 8) return 'three times daily';
  if (hours <= 12) return 'twice daily';
  if (hours <= 24) return 'daily';
  if (hours <= 84) return 'twice weekly';
  return 'weekly';
}

/** Format elapsed overdue hours as a human-readable days string */
function formatOverdue(overdueHours: number): string {
  if (overdueHours < 24) return 'less than 1 day';
  const days = Math.round(overdueHours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

// ─── Per-vital result ─────────────────────────────────────────────────────────

export interface PerVitalStatus {
  vitalKey: VitalType | 'bp';
  label: string;
  enabled: boolean;
  statusColor: VitalStatus | null; // null = disabled
  overdue: boolean;
  lastRecordedAt: string | null;   // ISO string
  expectedIntervalHours: number | null;
  elapsedHours: number | null;
  reasonText: string;
}

// ─── Module-level result ──────────────────────────────────────────────────────

export interface HealthMonitoringComputedStatus {
  moduleStatus: VitalStatus;      // Red | Amber | Ideal
  message: string;
  perVitalStatuses: PerVitalStatus[];
  overdueVitals: string[];        // labels of overdue vitals
  configMissing: boolean;
  latestEntry: VitalSignEntry | null;
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface ComputeHealthMonitoringStatusParams {
  config: VitalSignConfig | null | undefined;
  entries: VitalSignEntry[];
  alerts?: VitalSignAlert[];
  alteredCriteriaMap?: Record<VitalType, AlteredCriteria | null>;
  now?: Date; // injectable for tests; defaults to new Date()
}

// ─── Main function ────────────────────────────────────────────────────────────

export function computeHealthMonitoringStatus(
  params: ComputeHealthMonitoringStatusParams
): HealthMonitoringComputedStatus {
  const { config, entries, alerts = [], alteredCriteriaMap, now: nowParam } = params;
  const nowMs = (nowParam ?? new Date()).getTime();

  // ── Guard: config missing ────────────────────────────────────────────────
  if (!config) {
    console.error(
      '[computeHealthMonitoringStatus] config is missing — cannot evaluate schedule. Returning safe Amber.'
    );
    return {
      moduleStatus: 'amber',
      message: 'Health monitoring config missing — schedule cannot be evaluated',
      perVitalStatuses: [],
      overdueVitals: [],
      configMissing: true,
      latestEntry: entries[0] ?? null,
    };
  }

  // ── Recalculate latest entry statuses with altered criteria ──────────────
  const recalculatedEntries = entries.map(entry => {
    if (!alteredCriteriaMap) return entry;
    const statuses = calculateEntryStatuses(entry, alteredCriteriaMap);
    return { ...entry, ...statuses };
  });

  const latestEntry = recalculatedEntries[0] ?? null;

  // ── Helper: find last recorded timestamp for a vital ─────────────────────
  const lastTimestampFor = (
    predicate: (e: VitalSignEntry) => boolean
  ): string | null => {
    const found = recalculatedEntries.find(predicate);
    return found ? found.event_occurred_at : null;
  };

  // ── Helper: compute overdue for one vital ─────────────────────────────────
  const checkOverdue = (
    enabled: boolean,
    frequencyHours: number | null | undefined,
    lastRecordedAt: string | null
  ): { overdue: boolean; elapsedHours: number | null } => {
    if (!enabled || !frequencyHours) return { overdue: false, elapsedHours: null };
    const expectedMs = frequencyHours * 3_600_000;
    if (!lastRecordedAt) {
      // Never recorded → overdue immediately once config is set
      return { overdue: true, elapsedHours: null };
    }
    const lastMs = new Date(lastRecordedAt).getTime();
    const elapsedMs = nowMs - lastMs;
    return {
      overdue: elapsedMs > expectedMs,
      elapsedHours: Math.round(elapsedMs / 3_600_000),
    };
  };

  // ── Check active alerts ──────────────────────────────────────────────────
  const hasRedAlerts = alerts.some(a => a.severity === 'red' && !a.resolved_at);

  // ── Per-vital assessment ─────────────────────────────────────────────────

  // Temperature
  const tempLastAt = lastTimestampFor(e => e.temperature_celsius !== null);
  const tempOverdue = checkOverdue(config.temperature_enabled, config.temperature_frequency_hours, tempLastAt);
  const tempVitalStatus = latestEntry?.temperature_status ?? null;
  const tempStatus: PerVitalStatus = {
    vitalKey: 'temperature',
    label: 'Temperature',
    enabled: config.temperature_enabled,
    statusColor: !config.temperature_enabled ? null
      : tempOverdue.overdue ? 'amber'
      : tempVitalStatus,
    overdue: config.temperature_enabled && tempOverdue.overdue,
    lastRecordedAt: tempLastAt,
    expectedIntervalHours: config.temperature_frequency_hours ?? null,
    elapsedHours: tempOverdue.elapsedHours,
    reasonText: !config.temperature_enabled ? 'Disabled'
      : tempOverdue.overdue
        ? `Overdue by ${tempOverdue.elapsedHours != null ? formatOverdue(tempOverdue.elapsedHours - (config.temperature_frequency_hours ?? 0)) : 'unknown'} (expected ${frequencyLabel(config.temperature_frequency_hours ?? 24)})`
        : tempLastAt ? 'On schedule' : 'Not yet recorded',
  };

  // Blood Pressure (treated as one event)
  const bpLastAt = lastTimestampFor(e => e.bp_systolic !== null);
  const bpOverdue = checkOverdue(config.bp_enabled, config.bp_frequency_hours, bpLastAt);
  const bpVitalStatus = latestEntry?.bp_status ?? null;
  // Red reading > overdue (Amber); overdue only upgrades from Ideal
  const bpComputedStatus: VitalStatus | null = !config.bp_enabled ? null
    : bpVitalStatus === 'red' ? 'red'
    : bpOverdue.overdue ? 'amber'
    : bpVitalStatus;
  const bpStatus: PerVitalStatus = {
    vitalKey: 'bp',
    label: 'Blood Pressure',
    enabled: config.bp_enabled,
    statusColor: bpComputedStatus,
    overdue: config.bp_enabled && bpOverdue.overdue,
    lastRecordedAt: bpLastAt,
    expectedIntervalHours: config.bp_frequency_hours ?? null,
    elapsedHours: bpOverdue.elapsedHours,
    reasonText: !config.bp_enabled ? 'Disabled'
      : bpVitalStatus === 'red' ? 'Critical reading — action needed'
      : bpOverdue.overdue
        ? `Overdue by ${bpOverdue.elapsedHours != null ? formatOverdue(bpOverdue.elapsedHours - (config.bp_frequency_hours ?? 0)) : 'unknown'} (expected ${frequencyLabel(config.bp_frequency_hours ?? 24)})`
        : bpLastAt ? 'On schedule' : 'Not yet recorded',
  };

  // SpO₂
  const oxygenLastAt = lastTimestampFor(e => e.oxygen_saturation !== null);
  const oxygenOverdue = checkOverdue(config.oxygen_enabled, config.oxygen_frequency_hours, oxygenLastAt);
  const oxygenVitalStatus = latestEntry?.oxygen_status ?? null;
  const oxygenStatus: PerVitalStatus = {
    vitalKey: 'oxygen',
    label: 'SpO₂',
    enabled: config.oxygen_enabled,
    statusColor: !config.oxygen_enabled ? null
      : oxygenOverdue.overdue ? 'amber'
      : oxygenVitalStatus,
    overdue: config.oxygen_enabled && oxygenOverdue.overdue,
    lastRecordedAt: oxygenLastAt,
    expectedIntervalHours: config.oxygen_frequency_hours ?? null,
    elapsedHours: oxygenOverdue.elapsedHours,
    reasonText: !config.oxygen_enabled ? 'Disabled'
      : oxygenOverdue.overdue
        ? `Overdue by ${oxygenOverdue.elapsedHours != null ? `${oxygenOverdue.elapsedHours - (config.oxygen_frequency_hours ?? 0)}h` : 'unknown'} (expected ${frequencyLabel(config.oxygen_frequency_hours ?? 24)})`
        : oxygenLastAt ? 'On schedule' : 'Not yet recorded',
  };

  // Heart Rate
  const hrLastAt = lastTimestampFor(e => e.heart_rate !== null);
  const hrOverdue = checkOverdue(config.heart_rate_enabled, config.heart_rate_frequency_hours, hrLastAt);
  const hrVitalStatus = latestEntry?.heart_rate_status ?? null;
  const hrStatus: PerVitalStatus = {
    vitalKey: 'heart_rate',
    label: 'Heart Rate',
    enabled: config.heart_rate_enabled,
    statusColor: !config.heart_rate_enabled ? null
      : hrOverdue.overdue ? 'amber'
      : hrVitalStatus,
    overdue: config.heart_rate_enabled && hrOverdue.overdue,
    lastRecordedAt: hrLastAt,
    expectedIntervalHours: config.heart_rate_frequency_hours ?? null,
    elapsedHours: hrOverdue.elapsedHours,
    reasonText: !config.heart_rate_enabled ? 'Disabled'
      : hrOverdue.overdue
        ? `Overdue by ${hrOverdue.elapsedHours != null ? `${hrOverdue.elapsedHours - (config.heart_rate_frequency_hours ?? 0)}h` : 'unknown'} (expected ${frequencyLabel(config.heart_rate_frequency_hours ?? 24)})`
        : hrLastAt ? 'On schedule' : 'Not yet recorded',
  };

  // Respiratory Rate
  const respLastAt = lastTimestampFor(e => e.respiratory_rate !== null);
  const respOverdue = checkOverdue(config.respiratory_enabled, config.respiratory_frequency_hours, respLastAt);
  const respVitalStatus = latestEntry?.respiratory_status ?? null;
  const respStatus: PerVitalStatus = {
    vitalKey: 'respiratory',
    label: 'Resp. Rate',
    enabled: config.respiratory_enabled,
    statusColor: !config.respiratory_enabled ? null
      : respOverdue.overdue ? 'amber'
      : respVitalStatus,
    overdue: config.respiratory_enabled && respOverdue.overdue,
    lastRecordedAt: respLastAt,
    expectedIntervalHours: config.respiratory_frequency_hours ?? null,
    elapsedHours: respOverdue.elapsedHours,
    reasonText: !config.respiratory_enabled ? 'Disabled'
      : respOverdue.overdue
        ? `Overdue by ${respOverdue.elapsedHours != null ? `${respOverdue.elapsedHours - (config.respiratory_frequency_hours ?? 0)}h` : 'unknown'} (expected ${frequencyLabel(config.respiratory_frequency_hours ?? 24)})`
        : respLastAt ? 'On schedule' : 'Not yet recorded',
  };

  const perVitalStatuses = [tempStatus, bpStatus, oxygenStatus, hrStatus, respStatus];

  // ── Aggregate: Red > Amber > Ideal ───────────────────────────────────────
  const overdueVitals = perVitalStatuses
    .filter(v => v.overdue)
    .map(v => v.label);

  const allStatusColors = perVitalStatuses
    .filter(v => v.enabled)
    .map(v => v.statusColor)
    .filter((s): s is VitalStatus => s !== null);

  let moduleStatus: VitalStatus = 'ideal';
  if (hasRedAlerts || allStatusColors.includes('red')) {
    moduleStatus = 'red';
  } else if (allStatusColors.includes('amber') || overdueVitals.length > 0) {
    moduleStatus = 'amber';
  }

  // ── Build message ────────────────────────────────────────────────────────
  let message: string;
  if (moduleStatus === 'red') {
    message = 'Critical vital signs detected – immediate action required';
  } else if (overdueVitals.length > 0 && moduleStatus === 'amber') {
    message = `Observations overdue: ${overdueVitals.join(', ')}`;
  } else if (moduleStatus === 'amber') {
    message = 'Some vital signs require attention';
  } else if (!latestEntry) {
    message = 'No vital sign entries recorded yet';
  } else {
    message = 'All vital signs within normal range';
  }

  return {
    moduleStatus,
    message,
    perVitalStatuses,
    overdueVitals,
    configMissing: false,
    latestEntry,
  };
}
