/**
 * Epilepsy Status Calculator - Rolling window logic
 * Red > Amber > IDEAL hierarchy
 * 
 * Duration breach escalation:
 *   0–24h after event → Red
 *   24–48h after event → Amber
 *   48h+ → clears (IDEAL if no other triggers)
 */

import type { SeizureEvent, EpilepsyConfig, EpilepsyAlert, EpilepsyStatusInfo, DurationEscalationInfo } from '@/types/epilepsy';
import { differenceInMinutes, differenceInDays, differenceInHours } from 'date-fns';

interface CalculateParams {
  events: SeizureEvent[];
  config: Partial<EpilepsyConfig> | null;
  alerts: EpilepsyAlert[];
}

function windowToMinutes(value: number, unit: string): number {
  return unit === 'minutes' ? value : value * 60;
}

function windowLabel(value: number, unit: string): string {
  return `${value} ${unit}`;
}

const NO_ESCALATION: DurationEscalationInfo = {
  isActive: false,
  triggerEventDate: null,
  phase: null,
  hoursRemaining: 0,
  hoursElapsed: 0,
};

/**
 * Find the most recent seizure that exceeded duration threshold
 * and compute whether its timed escalation (Red 24h → Amber 24h) is still active.
 */
function computeDurationEscalation(
  events: SeizureEvent[],
  durationThreshold: number,
  now: Date
): DurationEscalationInfo {
  // Find events that exceeded the duration threshold, sorted newest first
  const breachEvents = events
    .filter(e => {
      const dur = e.duration_minutes + e.duration_seconds / 60;
      return dur >= durationThreshold;
    })
    .sort((a, b) => new Date(b.event_occurred_at).getTime() - new Date(a.event_occurred_at).getTime());

  if (breachEvents.length === 0) return NO_ESCALATION;

  const latest = breachEvents[0];
  const eventDate = new Date(latest.event_occurred_at);
  const hoursElapsed = differenceInMinutes(now, eventDate) / 60;

  if (hoursElapsed >= 48) return NO_ESCALATION;

  if (hoursElapsed < 24) {
    return {
      isActive: true,
      triggerEventDate: latest.event_occurred_at,
      phase: 'red',
      hoursRemaining: Math.max(0, 24 - hoursElapsed),
      hoursElapsed,
    };
  }

  // 24-48h
  return {
    isActive: true,
    triggerEventDate: latest.event_occurred_at,
    phase: 'amber',
    hoursRemaining: Math.max(0, 48 - hoursElapsed),
    hoursElapsed,
  };
}

export function calculateEpilepsyStatus({ events, config, alerts }: CalculateParams): EpilepsyStatusInfo {
  const now = new Date();
  const activeAlerts = alerts.filter(a => !a.resolved_at);

  // Config values
  const amberCount = config?.amber_seizure_count ?? 2;
  const amberWindow = config?.amber_seizure_window ?? 24;
  const amberUnit = config?.amber_seizure_window_unit ?? 'hours';
  const redCount = config?.red_seizure_count ?? 3;
  const redWindow = config?.red_seizure_window ?? 24;
  const redUnit = config?.red_seizure_window_unit ?? 'hours';
  const durationThreshold = config?.duration_threshold_minutes ?? 5;

  // Use the larger window for display
  const redWindowMin = windowToMinutes(redWindow, redUnit);
  const amberWindowMin = windowToMinutes(amberWindow, amberUnit);
  const displayWindowMin = Math.max(redWindowMin, amberWindowMin);
  const displayWindowLabel = redWindowMin >= amberWindowMin
    ? windowLabel(redWindow, redUnit)
    : windowLabel(amberWindow, amberUnit);

  // Events within windows
  const eventsInRedWindow = events.filter(e => differenceInMinutes(now, new Date(e.event_occurred_at)) <= redWindowMin);
  const eventsInAmberWindow = events.filter(e => differenceInMinutes(now, new Date(e.event_occurred_at)) <= amberWindowMin);
  const eventsInDisplayWindow = events.filter(e => differenceInMinutes(now, new Date(e.event_occurred_at)) <= displayWindowMin);

  const seizuresInWindow = eventsInDisplayWindow.length;

  // Longest duration in display window
  const longestDurationInWindow = eventsInDisplayWindow.reduce((max, e) => {
    const dur = e.duration_minutes + e.duration_seconds / 60;
    return dur > max ? dur : max;
  }, 0);

  // Compute timed duration escalation
  const durationEscalation = computeDurationEscalation(events, durationThreshold, now);

  const baseInfo = {
    amberThreshold: amberCount,
    redThreshold: redCount,
    windowLabel: displayWindowLabel,
    seizuresInWindow,
    longestDurationInWindow,
    durationThreshold,
    durationEscalation,
  };

  if (events.length === 0) {
    return {
      status: 'ideal',
      message: 'No seizure events recorded.',
      daysSinceLastSeizure: null,
      lastSeizureDate: null,
      activeAlerts,
      needsPrnPrompt: false,
      ...baseInfo,
      seizuresInWindow: 0,
      longestDurationInWindow: 0,
    };
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.event_occurred_at).getTime() - new Date(a.event_occurred_at).getTime()
  );
  const latest = sorted[0];
  const lastDate = new Date(latest.event_occurred_at);
  const daysSince = differenceInDays(now, lastDate);

  const commonFields = {
    daysSinceLastSeizure: daysSince,
    lastSeizureDate: latest.event_occurred_at,
    activeAlerts,
    ...baseInfo,
  };

  // 1️⃣ Duration threshold → timed escalation (Red 24h → Amber 24h)
  if (durationEscalation.isActive && durationEscalation.phase === 'red') {
    return {
      status: 'action',
      message: `Red: Seizure exceeded ${durationThreshold} min threshold — Red phase (${Math.ceil(durationEscalation.hoursRemaining)}h remaining).`,
      needsPrnPrompt: true,
      ...commonFields,
    };
  }

  // 2️⃣ Red frequency threshold
  if (eventsInRedWindow.length >= redCount) {
    return {
      status: 'action',
      message: `Red: ${eventsInRedWindow.length} seizures within ${windowLabel(redWindow, redUnit)} (threshold ≥${redCount}).`,
      needsPrnPrompt: true,
      ...commonFields,
    };
  }

  // 3️⃣ Duration escalation amber phase (24-48h)
  if (durationEscalation.isActive && durationEscalation.phase === 'amber') {
    return {
      status: 'monitor',
      message: `Amber: Post-duration-breach monitoring — Amber phase (${Math.ceil(durationEscalation.hoursRemaining)}h remaining).`,
      needsPrnPrompt: false,
      ...commonFields,
    };
  }

  // 4️⃣ Amber frequency threshold
  if (eventsInAmberWindow.length >= amberCount) {
    return {
      status: 'monitor',
      message: `Amber: ${eventsInAmberWindow.length} seizures within ${windowLabel(amberWindow, amberUnit)} (threshold ≥${amberCount}).`,
      needsPrnPrompt: false,
      ...commonFields,
    };
  }

  // 5️⃣ Check for injury or emergency on latest event
  const hasInjury = latest.recovery.includes('Injured (notes required)');
  const hasEmergency = latest.recovery.includes('Emergency support required');
  if (hasInjury || hasEmergency) {
    return {
      status: 'action',
      message: hasEmergency ? 'Red: Emergency support was required.' : 'Red: Injury recorded during seizure.',
      needsPrnPrompt: true,
      ...commonFields,
    };
  }

  // 6️⃣ Unresolved alerts → Amber
  if (activeAlerts.length > 0) {
    return {
      status: 'monitor',
      message: `${activeAlerts.length} unresolved alert(s).`,
      needsPrnPrompt: false,
      ...commonFields,
    };
  }

  // 7️⃣ IDEAL
  return {
    status: 'ideal',
    message: daysSince === 0
      ? 'Last seizure today – continue monitoring.'
      : `${daysSince} day${daysSince === 1 ? '' : 's'} since last seizure.`,
    needsPrnPrompt: false,
    ...commonFields,
  };
}
