/**
 * Centralized Sleep Status Calculator - Single Source of Truth
 */

import type { SleepEntry, SleepConfig, SleepStatus, SleepStatusInfo, DEFAULT_SLEEP_CONFIG } from '@/types/sleep';

interface CalculateSleepStatusParams {
  entries: SleepEntry[];
  config: {
    min_expected_sleep_hours: number;
    disruption_threshold: number;
    poor_sleep_threshold_hours: number;
    consecutive_disruption_alert_days: number;
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
  const awakenings = latest.number_of_awakenings;

  // Check for RED: poor sleep threshold
  if (hours < config.poor_sleep_threshold_hours) {
    return {
      status: 'action',
      message: `Poor sleep: ${hours.toFixed(1)} hours (below ${config.poor_sleep_threshold_hours}h threshold)`,
      lastEntry: `${hours.toFixed(1)}h sleep`,
    };
  }

  // Check for RED: severe restlessness
  if (latest.restlessness && awakenings >= config.disruption_threshold) {
    return {
      status: 'action',
      message: `Severe restlessness with ${awakenings} awakenings`,
      lastEntry: `${hours.toFixed(1)}h sleep • Restless`,
    };
  }

  // Check consecutive disrupted nights (last N days)
  const recentEntries = entries.slice(0, config.consecutive_disruption_alert_days);
  const disruptedNights = recentEntries.filter(
    e => Number(e.estimated_hours_slept) < config.min_expected_sleep_hours || e.number_of_awakenings >= config.disruption_threshold
  );
  if (recentEntries.length >= config.consecutive_disruption_alert_days && disruptedNights.length >= config.consecutive_disruption_alert_days) {
    return {
      status: 'action',
      message: `${config.consecutive_disruption_alert_days} consecutive disrupted nights`,
      lastEntry: `${hours.toFixed(1)}h sleep`,
    };
  }

  // Check for AMBER: below minimum or frequent awakenings
  if (hours < config.min_expected_sleep_hours) {
    return {
      status: 'monitor',
      message: `Below target: ${hours.toFixed(1)} hours (target ${config.min_expected_sleep_hours}h)`,
      lastEntry: `${hours.toFixed(1)}h sleep`,
    };
  }

  if (awakenings >= config.disruption_threshold) {
    return {
      status: 'monitor',
      message: `Frequent awakenings: ${awakenings} (threshold: ${config.disruption_threshold})`,
      lastEntry: `${hours.toFixed(1)}h • ${awakenings} awakenings`,
    };
  }

  // GREEN: IDEAL
  return {
    status: 'ideal',
    message: `Good sleep: ${hours.toFixed(1)} hours with ${awakenings} awakening${awakenings !== 1 ? 's' : ''}`,
    lastEntry: `${hours.toFixed(1)}h sleep • IDEAL`,
  };
}
