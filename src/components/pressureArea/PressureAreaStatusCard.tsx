/**
 * Pressure Area Prevention Status Tiles
 * Two separate indicator tiles: Pressure Relief (with countdown + upcoming) + Skin Check
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { RotateCcw, Eye, CheckCircle2, Clock, Timer, AlertCircle } from 'lucide-react';
import { differenceInMinutes, differenceInDays, formatDistanceToNow, addMinutes, format, parseISO } from 'date-fns';
import type { HealthStatus } from '@/types/ideal';
import type { RotationPosition, SkinCheckSession } from '@/types/pressureArea';
import { getPositionsForDay } from '@/types/pressureArea';

interface Props {
  clientId?: string;
  onLogPressureRelief: () => void;
  onLogSkinCheck: () => void;
  disabled?: boolean;
}

/* ──────────────────────────────────────────────
 * Countdown helper
 * ────────────────────────────────────────────── */
function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'NOW';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ──────────────────────────────────────────────
 * 1. Pressure Relief Tile — with countdown + upcoming positions
 * ────────────────────────────────────────────── */
function PressureReliefTile({
  clientId,
  onLog,
  disabled




}: {clientId?: string;onLog: () => void;disabled?: boolean;}) {
  const { plan } = usePressureReliefPlan(clientId);
  const { events } = usePressureReliefEvents(clientId);
  const { config } = usePressureAreaConfig(clientId);
  const [now, setNow] = useState(new Date());

  // Tick every 30s for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const latestEvent = events[0];
  const positions = plan?.rotation_sequence ? getPositionsForDay(plan.rotation_sequence) : [] as RotationPosition[];
  const intervalMinutes = plan?.interval_minutes || 0;
  const hasPlan = plan?.status === 'published' && plan.schedule_type !== 'as_required' && intervalMinutes > 0;

  // Build upcoming position schedule with completion status
  const { upcomingSlots, minutesUntilNext, hasPastDueSlot, status, statusLabel, detail } = useMemo(() => {
    let status: HealthStatus = 'stable';
    let statusLabel = 'On track';
    let detail: string | null = null;
    let minutesUntilNext = 0;

    if (!hasPlan || positions.length === 0) {
      return {
        upcomingSlots: [] as {position: string;dueAt: Date;completed: boolean;completedBy?: string;}[],
        minutesUntilNext: 0,
        hasPastDueSlot: false,
        status: !plan || plan.status === 'draft' ? 'monitor' as HealthStatus : 'stable' as HealthStatus,
        statusLabel: !plan || plan.status === 'draft' ? 'No plan published' : 'On track',
        detail: null as string | null
      };
    }

    // Build absolute schedule from plan's day_schedule_start + rotation sequence
    const dayStartStr = plan?.day_schedule_start || '06:00';
    const [startH, startM] = dayStartStr.split(':').map(Number);
    const todayBase = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);

    const dayEndStr = plan?.day_schedule_end;
    const todayEnd = dayEndStr ?
    (() => {
      const [endH, endM] = dayEndStr.split(':').map(Number);
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
    })() :
    null;

    const isWithinScheduleWindow = todayEnd ?
    todayEnd >= todayBase ?
    now >= todayBase && now <= todayEnd :
    now >= todayBase || now <= todayEnd :
    now >= todayBase;

    const todayEvents = events.filter((e) => {
      const d = new Date(e.event_occurred_at);
      return d.toDateString() === now.toDateString();
    });

    // Generate scheduled slots from the plan's rotation sequence for today
    // Track which events have already been matched to avoid double-counting
    const usedEventIds = new Set<string>();
    const slots: {position: string;dueAt: Date;completed: boolean;completedBy?: string;completedAt?: string;}[] = [];
    let cumulativeMinutes = 0;
    for (let i = 0; i < positions.length; i++) {
      const dueAt = addMinutes(todayBase, cumulativeMinutes);
      const timeStr = `${String(dueAt.getHours()).padStart(2, '0')}:${String(dueAt.getMinutes()).padStart(2, '0')}`;

      // 1. Exact match on scheduled_time field (like skin checks)
      let matchingEvent = todayEvents.find((e) => !usedEventIds.has(e.id) && (e as any).scheduled_time === timeStr);

      // 2. Fallback: position name + time proximity
      if (!matchingEvent) {
        matchingEvent = todayEvents.find((e) => {
          if (usedEventIds.has(e.id)) return false;
          const eventTime = new Date(e.event_occurred_at);
          return e.position_completed === positions[i].name &&
          Math.abs(differenceInMinutes(eventTime, dueAt)) < intervalMinutes / 2;
        });
      }

      // 3. Fallback: any event within ±2 hours of the slot (generous matching)
      if (!matchingEvent) {
        matchingEvent = todayEvents.find((e) => {
          if (usedEventIds.has(e.id)) return false;
          const eventTime = new Date(e.event_occurred_at);
          return Math.abs(differenceInMinutes(eventTime, dueAt)) <= 120;
        });
      }

      if (matchingEvent) usedEventIds.add(matchingEvent.id);

      slots.push({
        position: positions[i].name,
        dueAt,
        completed: !!matchingEvent,
        completedBy: matchingEvent?.completed_by_name || undefined,
        completedAt: matchingEvent?.event_occurred_at || undefined,
      });
      cumulativeMinutes += positions[i].target_duration_minutes || intervalMinutes;
    }

    // Show ALL slots for the day so staff can see completed, missed, and upcoming
    const relevantSlots = slots;

    // Countdown to next uncompleted slot
    const nextSlot = relevantSlots.find((s) => !s.completed && s.dueAt > now);
    const lastCompletedIndex = relevantSlots.reduce((lastIdx, slot, idx) =>
    slot.completed ? idx : lastIdx,
    -1);
    const pastDueSlot = relevantSlots.find((s, idx) => !s.completed && s.dueAt <= now && idx > lastCompletedIndex);
    minutesUntilNext = nextSlot ? differenceInMinutes(nextSlot.dueAt, now) : 0;
    const hasPastDueSlot = isWithinScheduleWindow && !!pastDueSlot;

    // Status logic — based on current schedule adherence
    if (latestEvent) {
      const minsSince = differenceInMinutes(now, new Date(latestEvent.event_occurred_at));
      const overdueRed = (plan?.overdue_red_minutes || 0) + intervalMinutes;

      if (minsSince >= overdueRed) {
        status = 'action';
        statusLabel = 'Overdue';
      } else if (minsSince >= intervalMinutes) {
        // Position is late — flag amber immediately once past due
        status = 'monitor';
        statusLabel = 'Late';
      }
    } else {
      status = 'monitor';
      statusLabel = 'Not yet logged';
    }

    // Compliance — always compute for display, but only escalate status
    // if the person is NOT currently back on track (i.e. already amber/red)
    if (config?.enable_compliance_scoring && events.length > 0) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEvts = events.filter((e) => new Date(e.event_occurred_at) >= todayStart);
      const dayMinutes = 16 * 60;
      const expectedCount = Math.floor(dayMinutes / intervalMinutes);
      if (expectedCount > 0) {
        const compliance = Math.round(todayEvts.length / expectedCount * 100);
        detail = `Today: ${todayEvts.length}/${expectedCount} (${compliance}%)`;
      }
    }

    return { upcomingSlots: relevantSlots, minutesUntilNext, hasPastDueSlot, status, statusLabel, detail };
  }, [plan, latestEvent, events, positions, intervalMinutes, hasPlan, config, now]);

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RotateCcw className="h-4 w-4 text-primary" />
            Pressure Relief
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {/* Status + Countdown */}
        <div className="space-y-1">
          <div className={`text-lg font-semibold ${
          status === 'action' ? 'text-destructive' :
          status === 'monitor' ? 'text-amber-600' : ''}`
          }>
            {statusLabel}
          </div>

          {hasPlan && minutesUntilNext > 0 &&
          <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium">Next due in: <span className={`${
              minutesUntilNext <= 10 ? 'text-destructive font-bold' :
              minutesUntilNext <= 30 ? 'text-amber-600 font-bold' : 'text-primary'}`
              }>{formatCountdown(minutesUntilNext)}</span></span>
            </div>
          }

          {hasPlan && hasPastDueSlot &&
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
              <Timer className="h-4 w-4" />
              <span>Position change due NOW</span>
            </div>
          }

          {latestEvent && (
            <p className="text-xs text-muted-foreground">
              Last: {formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}
              {latestEvent.created_by_name ? ` by ${latestEvent.created_by_name}` : ''}
            </p>
          )}
          {detail &&
          <p className="text-xs text-muted-foreground">{detail}</p>
          }
        </div>

        {/* Upcoming Positions Schedule */}
        {hasPlan && upcomingSlots.length > 0 &&
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Today's Schedule
            </p>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {upcomingSlots.map((slot, i) => {
              const isPast = slot.dueAt <= now && !slot.completed;
              const isFuture = slot.dueAt > now;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs border ${
                  slot.completed ?
                  'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' :
                  isPast ?
                  'bg-destructive/5 border-destructive/20' :
                  'bg-muted/50 border-border'}`
                  }>
                  
                    {slot.completed ?
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" /> :
                  isPast ?
                  <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" /> :

                  <div className="h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 border-muted-foreground/40" />
                  }
                    <span className={`flex-1 ${slot.completed ? 'line-through text-muted-foreground' : isPast ? 'text-destructive' : ''}`}>
                      {slot.position}
                    </span>
                    <span className={`text-[10px] whitespace-nowrap ${
                  slot.completed ? 'text-green-600' :
                  isPast ? 'text-destructive font-medium' : 'text-muted-foreground'}`
                  }>
                      {slot.completed ?
                    `✓${slot.completedBy ? ` ${slot.completedBy}` : ''}` :
                    isPast ?
                    `Missed ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                    slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                    </span>
                  </div>);

            })}
            </div>
          </div>
        }

        <Button onClick={onLog} className="w-full gap-2" size="sm" disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
          Log Pressure Relief
        </Button>
      </CardContent>
    </Card>);

}

/* ──────────────────────────────────────────────
 * 2. Skin Check Tile — with countdown + amber alert
 * ────────────────────────────────────────────── */
function SkinCheckTile({
  clientId,
  onLog,
  disabled




}: {clientId?: string;onLog: () => void;disabled?: boolean;}) {
  const { sessions } = useSkinChecks(clientId);
  const { config } = usePressureAreaConfig(clientId);
  const { plan } = usePressureReliefPlan(clientId);
  const [now, setNow] = useState(new Date());

  // Tick every 30s for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const latestCheck = sessions[0];

  const { hasUnresolvedRed, hasUnresolvedAmber, unresolvedCount } = useMemo(() => {
    const resolvedAreas = new Set<string>();
    let unresolvedRed = 0;
    let unresolvedAmber = 0;

    for (const session of sessions as Array<SkinCheckSession & {skin_finding_markers?: Array<{location: string;finding_type: string;severity: string;}>;}>) {
      const markers = session.skin_finding_markers || [];
      for (const marker of markers) {
        if (resolvedAreas.has(marker.location)) continue;

        if (marker.finding_type === 'ok') {
          resolvedAreas.add(marker.location);
        } else if (marker.finding_type !== 'unable' && (marker.severity === 'red' || marker.severity === 'amber')) {
          if (marker.severity === 'red') unresolvedRed += 1;
          if (marker.severity === 'amber') unresolvedAmber += 1;
          resolvedAreas.add(marker.location);
        }
      }
    }

    return {
      hasUnresolvedRed: unresolvedRed > 0,
      hasUnresolvedAmber: unresolvedAmber > 0,
      unresolvedCount: unresolvedRed + unresolvedAmber
    };
  }, [sessions]);

  // Calculate expected checks per day from skin_check_schedule
  const { totalChecksPerDay, skinCheckEnabled } = useMemo(() => {
    const schedule = plan?.skin_check_schedule || {};
    let total = 0;
    let enabled = false;
    Object.values(schedule).forEach((s: any) => {
      if (s?.enabled) {
        enabled = true;
        switch (s.frequency) {
          case 'twice_daily':total += 2;break;
          case 'three_times_daily':total += 3;break;
          case 'custom':total += s.custom_times_per_day || 1;break;
          default:total += 1;break; // daily
        }
      }
    });
    return { totalChecksPerDay: total, skinCheckEnabled: enabled };
  }, [plan]);

  // Count today's checks
  const todayChecks = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return sessions.filter((s) => new Date(s.event_occurred_at) >= todayStart).length;
  }, [sessions, now]);

  // Calculate time until next check is due
  // Uses "reset" logic: completing a check clears the alert; only the NEXT
  // upcoming slot after the latest check can trigger overdue.
  const { minutesUntilNext, isOverdue } = useMemo(() => {
    if (!skinCheckEnabled || totalChecksPerDay === 0) return { minutesUntilNext: 0, isOverdue: false };

    // Spread checks across waking hours (6am-10pm = 16h)
    const intervalHours = 16 / totalChecksPerDay;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0);

    if (now < todayStart || now > todayEnd) return { minutesUntilNext: 0, isOverdue: false };

    // All done for the day
    if (todayChecks >= totalChecksPerDay) return { minutesUntilNext: 0, isOverdue: false };

    // Find the latest check time today (if any)
    const latestCheckTime = sessions.length > 0 ?
    (() => {
      const todayStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todaySession = sessions.find((s) => new Date(s.event_occurred_at) >= todayStartDate);
      return todaySession ? new Date(todaySession.event_occurred_at) : null;
    })() :
    null;

    // Find the next slot that is AFTER the latest check (reset logic)
    // Only that slot can trigger an overdue alert.
    for (let i = 0; i < totalChecksPerDay; i++) {
      const slotTime = addMinutes(todayStart, i * intervalHours * 60);
      const nextSlotTime = i < totalChecksPerDay - 1 ?
      addMinutes(todayStart, (i + 1) * intervalHours * 60) :
      todayEnd;

      // Skip slots that started before the latest check — they're "reset"
      if (latestCheckTime && slotTime <= latestCheckTime) continue;

      // This is the next relevant slot
      if (now < slotTime) {
        // Slot hasn't started yet — show countdown, not overdue
        const mins = differenceInMinutes(slotTime, now);
        return { minutesUntilNext: Math.max(0, mins), isOverdue: false };
      }

      // We're inside this slot's window
      const mins = differenceInMinutes(nextSlotTime, now);
      const overdue = now > addMinutes(slotTime, 30); // 30 min grace
      return { minutesUntilNext: Math.max(0, mins), isOverdue: overdue };
    }

    // No relevant slots remain — all future slots cleared
    return { minutesUntilNext: 0, isOverdue: false };
  }, [skinCheckEnabled, totalChecksPerDay, todayChecks, sessions, now]);

  let status: HealthStatus = 'stable';
  let statusLabel = 'Healthy';
  let statusMessage: string | null = null;

  // Severity hierarchy: Red > Amber > Healthy
  if (hasUnresolvedRed) {
    status = 'action';
    statusLabel = 'Action Required';
    statusMessage = `${unresolvedCount} active finding${unresolvedCount === 1 ? '' : 's'} not yet cleared`;
  } else if (hasUnresolvedAmber) {
    status = 'monitor';
    statusLabel = 'Monitor';
    statusMessage = `${unresolvedCount} active skin change${unresolvedCount === 1 ? '' : 's'} not yet cleared`;
  } else if (latestCheck) {
    if (latestCheck.overall_status === 'red') {
      status = 'action';
      statusLabel = 'Action Required';
      statusMessage = 'Active concern – seek medical advice';
    } else if (latestCheck.overall_status === 'amber') {
      status = 'monitor';
      statusLabel = 'Monitor';
      statusMessage = 'Skin changes identified – monitor closely';
    }

    if (config) {
      const daysSince = differenceInDays(now, new Date(latestCheck.event_occurred_at));
      if (daysSince > config.skin_check_frequency_days) {
        if (status === 'stable') {
          status = 'monitor';
          statusLabel = 'Overdue';
          statusMessage = `Last check ${daysSince} days ago`;
        }
      }
    }
  } else {
    status = 'monitor';
    statusLabel = 'Not yet logged';
    statusMessage = 'No skin checks recorded';
  }

  // Amber alert for overdue skin check based on plan schedule
  if (isOverdue && status === 'stable') {
    status = 'monitor';
    statusLabel = 'Skin Check Due';
    statusMessage = `${todayChecks}/${totalChecksPerDay} checks completed today`;
  }

  const lastTime = latestCheck ?
  formatDistanceToNow(new Date(latestCheck.event_occurred_at), { addSuffix: true }) :
  null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4 text-primary" />
            Skin Check
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-1">
          <div className={`text-lg font-semibold ${
          status === 'action' ? 'text-destructive' :
          status === 'monitor' ? 'text-amber-600' : ''}`
          }>
            {statusLabel}
          </div>

          {/* Countdown timer */}
          {skinCheckEnabled && minutesUntilNext > 0 && !isOverdue &&
          <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium">Next check in: <span className={`${
              minutesUntilNext <= 30 ? 'text-amber-600 font-bold' : 'text-primary'}`
              }>{formatCountdown(minutesUntilNext)}</span></span>
            </div>
          }

          {isOverdue &&
          <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Skin check due NOW</span>
            </div>
          }

          {skinCheckEnabled && totalChecksPerDay > 0 &&
          <p className="text-xs text-muted-foreground">
              Today: {todayChecks}/{totalChecksPerDay} checks completed
            </p>
          }

          {statusMessage &&
          <p className="text-xs text-muted-foreground">{statusMessage}</p>
          }
          {lastTime &&
          <p className="text-xs text-muted-foreground">Last checked: {lastTime}</p>
          }
        </div>

        <Button onClick={onLog} className="w-full gap-2" size="sm" disabled={disabled}>
          <Eye className="h-4 w-4" />
          Log Skin Check
        </Button>
      </CardContent>
    </Card>);

}

/* ──────────────────────────────────────────────
 * Main Grid Component
 * ────────────────────────────────────────────── */
export function PressureAreaStatusCard({ clientId, onLogPressureRelief, onLogSkinCheck, disabled }: Props) {
  return (
    <div className="space-y-4">
      <PressureReliefTile clientId={clientId} onLog={onLogPressureRelief} disabled={disabled} />
    </div>);

}