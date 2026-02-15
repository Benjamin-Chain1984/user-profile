/**
 * Epilepsy Status Calculator - Single source of truth
 */

import type { SeizureEvent, EpilepsyConfig, EpilepsyAlert, EpilepsyStatus, EpilepsyStatusInfo } from '@/types/epilepsy';
import { differenceInHours, differenceInDays } from 'date-fns';

interface CalculateParams {
  events: SeizureEvent[];
  config: Partial<EpilepsyConfig> | null;
  alerts: EpilepsyAlert[];
}

export function calculateEpilepsyStatus({ events, config, alerts }: CalculateParams): EpilepsyStatusInfo {
  const now = new Date();
  const activeAlerts = alerts.filter(a => !a.resolved_at);

  if (events.length === 0) {
    return {
      status: 'ideal',
      message: 'No seizure events recorded.',
      daysSinceLastSeizure: null,
      lastSeizureDate: null,
      activeAlerts,
    };
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.event_occurred_at).getTime() - new Date(a.event_occurred_at).getTime()
  );
  const latest = sorted[0];
  const lastDate = new Date(latest.event_occurred_at);
  const daysSince = differenceInDays(now, lastDate);

  // Check for RED conditions
  const maxSeizures24h = config?.max_seizures_24h ?? 3;
  const durationThreshold = config?.duration_threshold_minutes ?? 5;
  const clusterCount = config?.cluster_seizure_count ?? 2;
  const clusterHours = config?.cluster_seizure_hours ?? 24;

  // Events in last 24h
  const last24h = sorted.filter(e => differenceInHours(now, new Date(e.event_occurred_at)) <= 24);
  
  // Cluster check
  const clusterWindow = sorted.filter(e => differenceInHours(now, new Date(e.event_occurred_at)) <= clusterHours);

  // Check for injury or emergency
  const hasInjury = latest.recovery.includes('Injured (notes required)');
  const hasEmergency = latest.recovery.includes('Emergency support required');

  // Check duration
  const totalDuration = latest.duration_minutes + (latest.duration_seconds / 60);
  const exceededDuration = totalDuration >= durationThreshold;

  // RED conditions
  if (
    last24h.length >= maxSeizures24h ||
    exceededDuration ||
    clusterWindow.length >= clusterCount ||
    hasInjury ||
    hasEmergency
  ) {
    let message = 'Action needed – ';
    if (last24h.length >= maxSeizures24h) message += `${last24h.length} seizures in 24h.`;
    else if (exceededDuration) message += `Seizure exceeded ${durationThreshold} minute threshold.`;
    else if (clusterWindow.length >= clusterCount) message += `Cluster detected: ${clusterWindow.length} seizures in ${clusterHours}h.`;
    else if (hasInjury) message += 'Injury recorded during seizure.';
    else if (hasEmergency) message += 'Emergency support was required.';

    return {
      status: 'action',
      message,
      daysSinceLastSeizure: daysSince,
      lastSeizureDate: latest.event_occurred_at,
      activeAlerts,
    };
  }

  // AMBER conditions - frequency increasing or approaching threshold
  const last7d = sorted.filter(e => differenceInDays(now, new Date(e.event_occurred_at)) <= 7);
  const prev7d = sorted.filter(e => {
    const d = differenceInDays(now, new Date(e.event_occurred_at));
    return d > 7 && d <= 14;
  });

  if (last7d.length > prev7d.length && last7d.length > 1) {
    return {
      status: 'monitor',
      message: `Seizure frequency increasing – ${last7d.length} events this week vs ${prev7d.length} previous week.`,
      daysSinceLastSeizure: daysSince,
      lastSeizureDate: latest.event_occurred_at,
      activeAlerts,
    };
  }

  if (last24h.length >= Math.max(1, maxSeizures24h - 1)) {
    return {
      status: 'monitor',
      message: `${last24h.length} seizure(s) in 24h – approaching threshold.`,
      daysSinceLastSeizure: daysSince,
      lastSeizureDate: latest.event_occurred_at,
      activeAlerts,
    };
  }

  if (activeAlerts.length > 0) {
    return {
      status: 'monitor',
      message: `${activeAlerts.length} unresolved alert(s).`,
      daysSinceLastSeizure: daysSince,
      lastSeizureDate: latest.event_occurred_at,
      activeAlerts,
    };
  }

  return {
    status: 'ideal',
    message: daysSince === 0 
      ? 'Last seizure today – continue monitoring.' 
      : `${daysSince} day${daysSince === 1 ? '' : 's'} since last seizure.`,
    daysSinceLastSeizure: daysSince,
    lastSeizureDate: latest.event_occurred_at,
    activeAlerts,
  };
}
