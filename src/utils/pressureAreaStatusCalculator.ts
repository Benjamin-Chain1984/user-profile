/**
 * Pressure Area Prevention - Centralized Status Calculator
 * Single source of truth for module status
 */

import { differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns';
import type { PressureAreaStatusInfo, PressureReliefEvent, SkinCheckSession, PressureReliefPlan } from '@/types/pressureArea';

interface StatusInput {
  plan: PressureReliefPlan | null;
  events: PressureReliefEvent[];
  skinChecks: SkinCheckSession[];
  config: {
    skin_check_frequency_days: number;
    enable_compliance_scoring: boolean;
  } | null;
  planAcknowledged: boolean;
}

export function calculatePressureAreaStatus(input: StatusInput): PressureAreaStatusInfo {
  const { plan, events, skinChecks, config, planAcknowledged } = input;

  // Check for active pressure areas (red skin checks)
  const latestSkinCheck = skinChecks[0];
  if (latestSkinCheck?.overall_status === 'red') {
    return {
      status: 'action',
      message: 'Active pressure area recorded – avoid pressure on affected area. Seek medical advice.',
      lastEntry: `Skin check ${formatDistanceToNow(new Date(latestSkinCheck.event_occurred_at), { addSuffix: true })}`,
    };
  }

  // Check for amber skin findings
  if (latestSkinCheck?.overall_status === 'amber') {
    return {
      status: 'monitor',
      message: 'Skin changes identified – monitor closely and escalate if worsening.',
      lastEntry: `Skin check ${formatDistanceToNow(new Date(latestSkinCheck.event_occurred_at), { addSuffix: true })}`,
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
      const overdueAmber = plan.overdue_amber_minutes + plan.interval_minutes;

      if (minutesSince >= overdueRed) {
        return {
          status: 'action',
          message: `Repositioning overdue – last completed ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
          lastEntry: `${latestEvent.position_completed} • ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
        };
      }
      if (minutesSince >= overdueAmber) {
        return {
          status: 'monitor',
          message: `Repositioning due soon – last completed ${formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}`,
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

  // Check skin check overdue
  if (config && latestSkinCheck) {
    const daysSince = differenceInDays(new Date(), new Date(latestSkinCheck.event_occurred_at));
    if (daysSince > config.skin_check_frequency_days) {
      return {
        status: 'monitor',
        message: `Skin check overdue – last completed ${daysSince} days ago.`,
        lastEntry: `Skin check ${formatDistanceToNow(new Date(latestSkinCheck.event_occurred_at), { addSuffix: true })}`,
      };
    }
  }

  // Compliance check
  if (config?.enable_compliance_scoring && events.length > 0) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEvents = events.filter(e => new Date(e.event_occurred_at) >= todayStart);
    
    if (plan?.interval_minutes && plan.schedule_type !== 'as_required') {
      const dayMinutes = 16 * 60; // ~16 waking hours
      const expectedCount = Math.floor(dayMinutes / plan.interval_minutes);
      const compliance = expectedCount > 0 ? Math.round((todayEvents.length / expectedCount) * 100) : 100;
      
      if (compliance < 70) {
        return {
          status: 'action',
          message: `Low compliance today: ${compliance}% (${todayEvents.length}/${expectedCount} repositions).`,
          lastEntry: events[0] ? `${events[0].position_completed} • ${formatDistanceToNow(new Date(events[0].event_occurred_at), { addSuffix: true })}` : 'Not yet logged',
          compliancePercent: compliance,
        };
      }
      if (compliance < 90) {
        return {
          status: 'monitor',
          message: `Compliance today: ${compliance}% (${todayEvents.length}/${expectedCount} repositions).`,
          lastEntry: events[0] ? `${events[0].position_completed} • ${formatDistanceToNow(new Date(events[0].event_occurred_at), { addSuffix: true })}` : 'Not yet logged',
          compliancePercent: compliance,
        };
      }
    }
  }

  // All clear
  const latestEntry = events[0] || latestSkinCheck;
  return {
    status: 'ideal',
    message: 'Pressure area prevention on track.',
    lastEntry: latestEntry
      ? `${formatDistanceToNow(new Date(latestEntry.event_occurred_at || latestEntry.created_at), { addSuffix: true })}`
      : 'Not yet logged',
  };
}
