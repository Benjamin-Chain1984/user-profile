/**
 * Centralized Sleep Status Calculator - Single Source of Truth
 * Supports both excessive sleep and structured awakening events.
 */

import type { SleepEntry, SleepStatus, SleepStatusInfo } from '@/types/sleep';
import { getAwakeningCount, hasProlongedAwakenings, countProlongedAwakenings } from '@/types/sleep';

interface CalculateSleepStatusParams {
  entries: SleepEntry[];
  config: {
    min_expected_sleep_hours: number;
    disruption_threshold: number;
    poor_sleep_threshold_hours: number;
    consecutive_disruption_alert_days: number;
    max_sleep_threshold_hours: number;
    consecutive_excessive_sleep_trigger: number;
  };
}

export function calculateSleepStatus({ entries, config }: CalculateSleepStatusParams): SleepStatusInfo {
  if (!entries.length) {
    return {
      status: 'ideal',
      message: 'No sleep data logged yet',
      lastEntry: 'Not yet logged',
    };
  }

  const latest = entries[0];
  const hours = Number(latest.estimated_hours_slept);
  const awakenings = getAwakeningCount(latest);
  const prolongedCount = countProlongedAwakenings(latest);

  // === RED CHECKS ===

  // Poor sleep threshold
  if (hours < config.poor_sleep_threshold_hours) {
    return {
      status: 'action',
      message: `Poor sleep: ${hours.toFixed(1)} hours (below ${config.poor_sleep_threshold_hours}h threshold)`,
      lastEntry: `${hours.toFixed(1)}h sleep`,
    };
  }

  // Severe restlessness with frequent awakenings
  if (latest.restlessness && awakenings >= config.disruption_threshold) {
    return {
      status: 'action',
      message: `Severe restlessness with ${awakenings} awakenings`,
      lastEntry: `${hours.toFixed(1)}h sleep • Restless`,
    };
  }

  // Multiple prolonged awakenings (>30 min)
  if (prolongedCount >= 2) {
    return {
      status: 'action',
      message: `${prolongedCount} prolonged awakenings (>30 min) recorded`,
      lastEntry: `${hours.toFixed(1)}h sleep • ${prolongedCount} prolonged awakenings`,
    };
  }

  // Consecutive disrupted nights
  const recentForDisruption = entries.slice(0, config.consecutive_disruption_alert_days);
  const disruptedNights = recentForDisruption.filter(
    e => Number(e.estimated_hours_slept) < config.min_expected_sleep_hours ||
      getAwakeningCount(e) >= config.disruption_threshold
  );
  if (recentForDisruption.length >= config.consecutive_disruption_alert_days &&
    disruptedNights.length >= config.consecutive_disruption_alert_days) {
    return {
      status: 'action',
      message: `${config.consecutive_disruption_alert_days} consecutive disrupted nights`,
      lastEntry: `${hours.toFixed(1)}h sleep`,
    };
  }

  // Consecutive excessive sleep
  const recentForExcessive = entries.slice(0, config.consecutive_excessive_sleep_trigger);
  const excessiveNights = recentForExcessive.filter(
    e => Number(e.estimated_hours_slept) > config.max_sleep_threshold_hours
  );
  if (recentForExcessive.length >= config.consecutive_excessive_sleep_trigger &&
    excessiveNights.length >= config.consecutive_excessive_sleep_trigger) {
    return {
      status: 'action',
      message: `Excessive sleep for ${config.consecutive_excessive_sleep_trigger} consecutive nights. Consider illness, medication effects, mood changes, or fatigue. Seek clinical advice if concerned.`,
      lastEntry: `${hours.toFixed(1)}h sleep • Excessive`,
    };
  }

  // === AMBER CHECKS ===

  // Single night excessive sleep
  if (hours > config.max_sleep_threshold_hours) {
    return {
      status: 'monitor',
      message: `Sleep duration unusually high: ${hours.toFixed(1)} hours (threshold ${config.max_sleep_threshold_hours}h). Consider illness, medication effects, mood changes, or fatigue. Seek clinical advice if concerned.`,
      lastEntry: `${hours.toFixed(1)}h sleep • High`,
    };
  }

  // Below minimum
  if (hours < config.min_expected_sleep_hours) {
    return {
      status: 'monitor',
      message: `Below target: ${hours.toFixed(1)} hours (target ${config.min_expected_sleep_hours}h)`,
      lastEntry: `${hours.toFixed(1)}h sleep`,
    };
  }

  // Frequent awakenings
  if (awakenings >= config.disruption_threshold) {
    return {
      status: 'monitor',
      message: `Frequent awakenings: ${awakenings} (threshold: ${config.disruption_threshold})`,
      lastEntry: `${hours.toFixed(1)}h • ${awakenings} awakenings`,
    };
  }

  // === GREEN ===
  return {
    status: 'ideal',
    message: `Good sleep: ${hours.toFixed(1)} hours with ${awakenings} awakening${awakenings !== 1 ? 's' : ''}`,
    lastEntry: `${hours.toFixed(1)}h sleep • IDEAL`,
  };
}
