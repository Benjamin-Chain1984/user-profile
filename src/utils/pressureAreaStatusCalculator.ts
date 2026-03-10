/**
 * Pressure Area Prevention - Centralized Status Calculator
 * Single source of truth for module status
 */

import { differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns';
import type { PressureAreaStatusInfo, PressureReliefEvent, SkinCheckSession, PressureReliefPlan, SkinFindingMarker } from '@/types/pressureArea';
import { HIGH_RISK_AREAS } from '@/types/pressureArea';

interface StatusInput {
  plan: PressureReliefPlan | null;
  events: PressureReliefEvent[];
  skinChecks: (SkinCheckSession & { skin_finding_markers?: SkinFindingMarker[] })[];
  config: {
    skin_check_frequency_days: number;
    enable_compliance_scoring: boolean;
    skin_checks_per_day?: number;
    skin_check_times?: string[];
  } | null;
  planAcknowledged: boolean;
}

/**
 * Walk skin check sessions (newest first) and determine which findings
 * have NOT been cleared by a subsequent 'ok' check on the same area.
 */
function getUnresolvedFindings(skinChecks: (SkinCheckSession & { skin_finding_markers?: SkinFindingMarker[] })[]) {
  // Track per-area: once we see 'ok' for an area (in a newer session), it's resolved.
  const resolvedAreas = new Set<string>();
  const unresolved: { location: string; severity: string; findingType: string }[] = [];

  for (const session of skinChecks) {
    const markers = (session as any).skin_finding_markers || [];
    for (const m of markers) {
      if (resolvedAreas.has(m.location)) continue; // already cleared by a newer check

      if (m.finding_type === 'ok') {
        // This area was checked OK — marks it as resolved
        resolvedAreas.add(m.location);
      } else if (m.finding_type !== 'unable' && (m.severity === 'red' || m.severity === 'amber')) {
        // Active finding — not yet resolved
        unresolved.push({ location: m.location, severity: m.severity, findingType: m.finding_type });
        resolvedAreas.add(m.location); // don't double-count from older sessions
      }
    }
  }

  return unresolved;
}

export function calculatePressureAreaStatus(input: StatusInput): PressureAreaStatusInfo {
  const { plan, events, skinChecks, config, planAcknowledged } = input;

  // --- Unresolved skin findings logic ---
  // A finding (amber/red) on a specific area persists until a later check
  // marks that same area as 'ok'. Walk sessions newest→oldest to build
  // the set of unresolved findings.
  const unresolvedFindings = getUnresolvedFindings(skinChecks);

  const hasUnresolvedRed = unresolvedFindings.some(f => f.severity === 'red');
  const hasUnresolvedAmber = unresolvedFindings.some(f => f.severity === 'amber');

  if (hasUnresolvedRed) {
    const redAreas = unresolvedFindings.filter(f => f.severity === 'red').map(f => {
      const area = HIGH_RISK_AREAS.find(a => a.id === f.location);
      return area?.label || f.location;
    });
    const latestSkinCheck = skinChecks[0];
    return {
      status: 'action',
      message: `Active pressure area (${redAreas.join(', ')}) – not yet cleared. Avoid pressure on affected area. Seek medical advice.`,
      lastEntry: latestSkinCheck
        ? `Skin check ${formatDistanceToNow(new Date(latestSkinCheck.event_occurred_at), { addSuffix: true })}`
        : 'Not yet logged',
    };
  }

  if (hasUnresolvedAmber) {
    const amberAreas = unresolvedFindings.filter(f => f.severity === 'amber').map(f => {
      const area = HIGH_RISK_AREAS.find(a => a.id === f.location);
      return area?.label || f.location;
    });
    const latestSkinCheck = skinChecks[0];
    return {
      status: 'monitor',
      message: `Skin changes on ${amberAreas.join(', ')} – not yet cleared. Monitor closely and escalate if worsening.`,
      lastEntry: latestSkinCheck
        ? `Skin check ${formatDistanceToNow(new Date(latestSkinCheck.event_occurred_at), { addSuffix: true })}`
        : 'Not yet logged',
    };
  }

  // Check plan acknowledgement
  if (plan?.status === 'published' && !planAcknowledged) {
    return {
      status: 'monitor',
      message: 'Pressure Relief Plan acknowledgement required.',
      lastEntry: plan.published_at ? `Plan updated ${formatDistanceToNow(new Date(plan.published_at), { addSuffix: true })}` : 'Plan updated',
    };
  }

  // Check repositioning overdue
  if (plan?.status === 'published' && plan.schedule_type !== 'as_required') {
    const latestEvent = events[0];
    if (latestEvent) {
      const minutesSince = differenceInHours(new Date(), new Date(latestEvent.event_occurred_at)) * 60;
      const overdueRed = plan.overdue_red_minutes + plan.interval_minutes;

      if (minutesSince >= overdueRed) {
        return {
          status: 'action',
          message: `Repositioning overdue – last completed ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
          lastEntry: `${latestEvent.position_completed} • ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
        };
      }
      if (minutesSince >= plan.interval_minutes) {
        return {
          status: 'monitor',
          message: `Repositioning late – last completed ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
          lastEntry: `${latestEvent.position_completed} • ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
        };
      }
    } else if (plan) {
      // No events logged yet but plan exists
      return {
        status: 'monitor',
        message: 'No pressure relief events logged yet.',
        lastEntry: 'Not yet logged',
      };
    }
  }

  // Check scheduled skin check — only flag if the NEXT uncompleted slot is
  // past its grace window. Once back on track, status clears to green.
  if (config?.skin_checks_per_day && config.skin_check_times?.length) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todaySessions = skinChecks.filter(s => new Date(s.event_occurred_at) >= todayStart);

    // Find the first uncompleted scheduled slot
    const sortedTimes = [...config.skin_check_times].sort();
    for (const time of sortedTimes) {
      const hasMatch = todaySessions.some(s => (s as any).scheduled_time === time);
      if (hasMatch) continue; // slot completed — skip

      // This is the next uncompleted slot
      const [h, m] = time.split(':').map(Number);
      const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      const graceEnd = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000);

      if (now > graceEnd) {
        return {
          status: 'monitor' as const,
          message: `Scheduled skin check missed (${time} check not completed).`,
          lastEntry: skinChecks[0]
            ? `Skin check ${formatDistanceToNow(new Date(skinChecks[0].event_occurred_at), { addSuffix: true })}`
            : 'Not yet logged',
        };
      }
      break; // Only check the next uncompleted slot
    }
  }

  // Check skin check overdue (legacy day-based) — only when schedule-based mode is NOT active
  if (!config?.skin_checks_per_day || !config.skin_check_times?.length) {
    const latestSkinCheckForDays = skinChecks[0];
    if (config && latestSkinCheckForDays) {
      const daysSince = differenceInDays(new Date(), new Date(latestSkinCheckForDays.event_occurred_at));
      if (daysSince > config.skin_check_frequency_days) {
        return {
          status: 'monitor',
          message: `Skin check overdue – last completed ${daysSince} days ago.`,
          lastEntry: `Skin check ${formatDistanceToNow(new Date(latestSkinCheckForDays.event_occurred_at), { addSuffix: true })}`,
        };
      }
    }
  }

  // Compliance info — show score but don't block green when back on schedule.
  // Status is only escalated by actual overdue/late repositioning or skin findings above.
  let compliancePercent: number | undefined;
  if (config?.enable_compliance_scoring && events.length > 0) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEvents = events.filter(e => new Date(e.event_occurred_at) >= todayStart);
    
    if (plan?.interval_minutes && plan.schedule_type !== 'as_required') {
      const dayMinutes = 16 * 60;
      const expectedCount = Math.floor(dayMinutes / plan.interval_minutes);
      if (expectedCount > 0) {
        compliancePercent = Math.round((todayEvents.length / expectedCount) * 100);
      }
    }
  }

  // All clear — back on track = GREEN
  const latestEntry = events[0] || skinChecks[0];
  return {
    status: 'ideal',
    message: 'Pressure area prevention on track.',
    lastEntry: latestEntry
      ? `${formatDistanceToNow(new Date(latestEntry.event_occurred_at || latestEntry.created_at), { addSuffix: true })}`
      : 'Not yet logged',
    compliancePercent,
  };
}
