/**
 * Bowel Care Status Calculator - Single Source of Truth
 * 
 * This utility provides the authoritative status calculation for bowel care.
 * It is used by:
 * - useBowelCareStatus hook (module landing page)
 * - ProfileContext (dashboard alerts and module tiles)
 * 
 * All status decisions use event_occurred_at as the primary timestamp
 * for clinical accuracy with backdated entries.
 */

import { differenceInDays, differenceInHours } from 'date-fns';
import type { BowelCareStatus, BowelCareStatusInfo, BowelIndicators, BowelCareAlert } from '@/types/bowelCare';

export interface BowelCareConfig {
  no_bm_days_threshold: number;
  type1_consecutive_days_threshold: number;
  diarrhoea_type67_count_threshold: number;
  diarrhoea_hours_window: number;
  amber_days_threshold?: number; // Days before amber warning (default: noBmDays - 1)
}

export interface BowelLogEntry {
  id: string;
  bristol_type: number;
  entry_time: string;
  event_occurred_at: string | null;
  indicators?: BowelIndicators | Record<string, unknown>;
}

export interface CalculatedBowelStatus {
  status: BowelCareStatus;
  message: string;
  daysSinceLastBm: number | null;
  lastBristolType: number | null;
  lastEventTimestamp: string | null;
}

const DEFAULT_CONFIG: BowelCareConfig = {
  no_bm_days_threshold: 3,
  type1_consecutive_days_threshold: 2,
  diarrhoea_type67_count_threshold: 3,
  diarrhoea_hours_window: 48,
};

/**
 * Get the effective timestamp for a log entry.
 * Uses event_occurred_at if available, falls back to entry_time.
 */
function getEffectiveTimestamp(log: BowelLogEntry): Date {
  return new Date(log.event_occurred_at || log.entry_time);
}

/**
 * Calculate bowel care status from logs and config.
 * This is the SINGLE SOURCE OF TRUTH for status calculation.
 */
export function calculateBowelCareStatus(
  logs: BowelLogEntry[],
  config: Partial<BowelCareConfig> = {},
  alerts: BowelCareAlert[] = []
): CalculatedBowelStatus {
  const effectiveConfig: BowelCareConfig = { ...DEFAULT_CONFIG, ...config };
  const now = new Date();
  
  // Default: amber threshold is one day before red threshold
  const amberThreshold = effectiveConfig.amber_days_threshold ?? 
    Math.max(1, effectiveConfig.no_bm_days_threshold - 1);

  // No logs case
  if (!logs || logs.length === 0) {
    return {
      status: 'monitor',
      message: 'No bowel entries recorded yet',
      daysSinceLastBm: null,
      lastBristolType: null,
      lastEventTimestamp: null,
    };
  }

  // Find last actual bowel movement (bristol_type > 0) using event_occurred_at
  const lastActualBm = logs.find(l => l.bristol_type > 0);
  const daysSinceLastBm = lastActualBm
    ? differenceInDays(now, getEffectiveTimestamp(lastActualBm))
    : null;
  
  const lastBristolType = lastActualBm?.bristol_type ?? null;
  const lastEventTimestamp = lastActualBm 
    ? (lastActualBm.event_occurred_at || lastActualBm.entry_time)
    : logs[0]?.event_occurred_at || logs[0]?.entry_time || null;

  // === RED FLAG INDICATORS (highest priority) ===
  const recentLogs = logs.slice(0, 3);
  const hasRedFlags = recentLogs.some(l => {
    const ind = l.indicators as BowelIndicators | undefined;
    if (!ind) return false;
    return (
      ind.blood === 'bright_red' ||
      ind.blood === 'dark_tarry' ||
      ind.pain === 'severe' ||
      ind.abdominal_pain === 'severe' ||
      ind.vomiting === true
    );
  });

  if (hasRedFlags) {
    return {
      status: 'action',
      message: 'Concerning symptoms detected – seek urgent medical review',
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === NO BOWEL MOVEMENT THRESHOLD (RED) ===
  if (daysSinceLastBm !== null && daysSinceLastBm >= effectiveConfig.no_bm_days_threshold) {
    return {
      status: 'action',
      message: `No bowel movement for ${daysSinceLastBm} days – seek urgent medical review`,
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === CONSECUTIVE TYPE 1 (CONSTIPATION) ===
  const actualBMs = logs.filter(l => l.bristol_type > 0);
  const recentActualBMs = actualBMs.slice(0, effectiveConfig.type1_consecutive_days_threshold);
  const type1ThresholdMet = 
    recentActualBMs.length >= effectiveConfig.type1_consecutive_days_threshold &&
    recentActualBMs.every(l => l.bristol_type === 1);

  if (type1ThresholdMet) {
    return {
      status: 'action',
      message: `Consecutive hard stools (Type 1) – constipation risk, action required`,
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === DIARRHOEA THRESHOLD (TYPE 6-7) — RED if threshold met ===
  // Only count Type 6/7 entries that are MORE RECENT than the last healthy stool (types 2-5)
  const lastHealthyBm = logs.find(l => l.bristol_type >= 2 && l.bristol_type <= 5);
  const lastHealthyTime = lastHealthyBm ? getEffectiveTimestamp(lastHealthyBm) : null;

  const recentDiarrhoea = logs.filter(l => {
    const eventTime = getEffectiveTimestamp(l);
    const hoursDiff = differenceInHours(now, eventTime);
    if ((l.bristol_type !== 6 && l.bristol_type !== 7) || hoursDiff > effectiveConfig.diarrhoea_hours_window) return false;
    // If a healthy stool was logged after this diarrhoea entry, don't count it
    if (lastHealthyTime && eventTime < lastHealthyTime) return false;
    return true;
  });
  
  if (recentDiarrhoea.length >= effectiveConfig.diarrhoea_type67_count_threshold) {
    return {
      status: 'action',
      message: `Persistent loose stools – consider medical review`,
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === DIARRHOEA AMBER: Any Type 6 or 7 (below threshold, and more recent than last healthy stool) ===
  if (recentDiarrhoea.length > 0) {
    return {
      status: 'monitor',
      message: `Loose/watery stool recorded – monitoring`,
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === AMBER: APPROACHING THRESHOLD ===
  if (daysSinceLastBm !== null && daysSinceLastBm >= amberThreshold) {
    return {
      status: 'monitor',
      message: `${daysSinceLastBm} day${daysSinceLastBm === 1 ? '' : 's'} since last bowel movement – attention required`,
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === AMBER: NO ACTUAL BM YET (only Type 0 entries) ===
  if (lastActualBm === undefined && logs.length > 0) {
    return {
      status: 'monitor',
      message: 'Bowel not opened – monitoring',
      daysSinceLastBm: null,
      lastBristolType: 0,
      lastEventTimestamp,
    };
  }

  // === AMBER: ACTIVE ALERTS ===
  if (alerts.length > 0) {
    return {
      status: 'monitor',
      message: 'Active alerts require attention',
      daysSinceLastBm,
      lastBristolType,
      lastEventTimestamp,
    };
  }

  // === IDEAL: All good ===
  return {
    status: 'ideal',
    message: 'Regular bowel pattern',
    daysSinceLastBm,
    lastBristolType,
    lastEventTimestamp,
  };
}

/**
 * Convert calculated status to full BowelCareStatusInfo
 */
export function toBowelCareStatusInfo(
  calculated: CalculatedBowelStatus,
  alerts: BowelCareAlert[] = []
): BowelCareStatusInfo {
  return {
    status: calculated.status,
    message: calculated.message,
    daysSinceLastBm: calculated.daysSinceLastBm,
    lastBristolType: calculated.lastBristolType,
    activeAlerts: alerts,
  };
}
