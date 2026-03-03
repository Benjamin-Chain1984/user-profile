/**
 * Enteral Nutrition Status Calculator
 */

import { differenceInDays, differenceInHours, parseISO, isToday, addMinutes } from 'date-fns';
import type { EnteralConfig, EnteralFeedLog, EnteralStomaCheck, EnteralMedicationLog } from '@/types/enteral';
import { calculateEnteralStomaStatus, tubeRequiresStomaCheck } from '@/types/enteral';

interface EnteralStatusInput {
  config: EnteralConfig | null;
  feedLogs: EnteralFeedLog[];
  stomaChecks: EnteralStomaCheck[];
  medLogs: EnteralMedicationLog[];
}

interface EnteralStatusResult {
  status: 'stable' | 'monitor' | 'action';
  message: string;
  lastEntry: string;
  todayFeedVolume: number;
  todayFlushVolume: number;
  todayMedFlushVolume: number;
  todayTotalEnteral: number;
  feedsToday: number;
  feedsScheduled: number;
  missedFeeds: number;
  tubeChangeDays: number | null;
  tubeChangeOverdue: boolean;
}

export function calculateEnteralStatus(input: EnteralStatusInput): EnteralStatusResult {
  const { config, feedLogs, stomaChecks, medLogs } = input;
  const now = new Date();

  // Today's logs
  const todayFeeds = feedLogs.filter(l => isToday(new Date(l.event_occurred_at)));
  const todayMeds = medLogs.filter(l => isToday(new Date(l.event_occurred_at)));

  const todayFeedVolume = todayFeeds.reduce((s, l) => s + l.feed_volume_ml, 0);
  const todayFlushVolume = todayFeeds.reduce((s, l) => s + l.flush_given_ml, 0);
  const todayMedFlushVolume = todayMeds.reduce((s, l) => s + l.flush_before_ml + l.flush_after_ml, 0);
  const todayTotalEnteral = todayFeedVolume + todayFlushVolume + todayMedFlushVolume;

  const feedsScheduled = config?.feed_schedule_times?.length ?? 0;
  const feedsToday = todayFeeds.length;

  // Count missed feeds (past grace window, no matching log)
  let missedFeeds = 0;
  if (config?.feed_schedule_times) {
    const graceMinutes = config.grace_window_mins || 60;
    const todayStr = now.toISOString().split('T')[0];
    for (const time of config.feed_schedule_times) {
      const scheduledAt = new Date(`${todayStr}T${time}:00`);
      const deadline = addMinutes(scheduledAt, graceMinutes);
      if (now > deadline) {
        // Check if any feed logged within window
        const hasFeed = todayFeeds.some(f => {
          const ft = new Date(f.event_occurred_at);
          return Math.abs(ft.getTime() - scheduledAt.getTime()) <= graceMinutes * 60 * 1000;
        });
        if (!hasFeed) missedFeeds++;
      }
    }
  }

  // Tube change
  let tubeChangeDays: number | null = null;
  let tubeChangeOverdue = false;
  if (config?.next_tube_change_due) {
    tubeChangeDays = differenceInDays(parseISO(config.next_tube_change_due), now);
    const overdueDays = config.tube_change_overdue_days || 1;
    tubeChangeOverdue = tubeChangeDays < -overdueDays + 1;
  }

  // Stoma check status
  const lastStoma = stomaChecks[0];
  const hoursSinceStoma = lastStoma ? differenceInHours(now, parseISO(lastStoma.event_occurred_at)) : null;
  const stomaStatus = lastStoma && config?.enable_stoma_checks && tubeRequiresStomaCheck(config.tube_type as any)
    ? calculateEnteralStomaStatus(lastStoma.findings as any, lastStoma.pain_level as any, hoursSinceStoma)
    : 'green';

  // Determine status
  let status: 'stable' | 'monitor' | 'action' = 'stable';
  let message = 'Enteral nutrition on track.';

  const missedThreshold = config?.missed_feed_red_threshold ?? 2;

  // RED conditions
  if (tubeChangeOverdue) {
    status = 'action';
    message = `Tube change overdue by ${Math.abs(tubeChangeDays!)} day(s).`;
  } else if (missedFeeds >= missedThreshold) {
    status = 'action';
    message = `${missedFeeds} feeds missed – feeding schedule not met.`;
  } else if (stomaStatus === 'red') {
    status = 'action';
    message = 'Stoma site concern – escalation required.';
  }
  // AMBER conditions
  else if (missedFeeds > 0) {
    status = 'monitor';
    message = `${missedFeeds} feed(s) late – attend when possible.`;
  } else if (tubeChangeDays !== null && tubeChangeDays <= (config?.tube_change_alert_lead_days ?? 7)) {
    status = 'monitor';
    message = `Tube change due in ${tubeChangeDays} day(s).`;
  } else if (stomaStatus === 'amber') {
    status = 'monitor';
    message = 'Stoma site requires monitoring.';
  }

  const lastFeed = feedLogs[0];
  const lastEntry = lastFeed
    ? `${todayFeedVolume}ml today • ${feedsToday}/${feedsScheduled} feeds`
    : 'Not yet logged';

  return {
    status,
    message,
    lastEntry,
    todayFeedVolume,
    todayFlushVolume,
    todayMedFlushVolume,
    todayTotalEnteral,
    feedsToday,
    feedsScheduled,
    missedFeeds,
    tubeChangeDays,
    tubeChangeOverdue,
  };
}
