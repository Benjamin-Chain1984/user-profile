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
import { RotateCcw, Eye, CheckCircle2, Clock, Timer } from 'lucide-react';
import { differenceInMinutes, differenceInDays, formatDistanceToNow, addMinutes } from 'date-fns';
import type { HealthStatus } from '@/types/ideal';
import type { RotationPosition } from '@/types/pressureArea';

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
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
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
  const positions = (plan?.rotation_sequence || []) as RotationPosition[];
  const intervalMinutes = plan?.interval_minutes || 0;
  const hasPlan = plan?.status === 'published' && plan.schedule_type !== 'as_required' && intervalMinutes > 0;

  // Build upcoming position schedule with completion status
  const { upcomingSlots, minutesUntilNext, status, statusLabel, detail } = useMemo(() => {
    let status: HealthStatus = 'stable';
    let statusLabel = 'On track';
    let detail: string | null = null;
    let minutesUntilNext = 0;

    if (!hasPlan || positions.length === 0) {
      return {
        upcomingSlots: [] as { position: string; dueAt: Date; completed: boolean; completedBy?: string }[],
        minutesUntilNext: 0,
        status: (!plan || plan.status === 'draft') ? 'monitor' as HealthStatus : 'stable' as HealthStatus,
        statusLabel: (!plan || plan.status === 'draft') ? 'No plan published' : 'On track',
        detail: null as string | null,
      };
    }

    // Calculate the schedule slots going forward from the last event
    const baseTime = latestEvent
      ? new Date(latestEvent.event_occurred_at)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0); // default 6am start

    // Figure out which position index we're on based on last completed
    let lastPositionIdx = 0;
    if (latestEvent) {
      const idx = positions.findIndex(p => p.name === latestEvent.position_completed);
      if (idx >= 0) lastPositionIdx = idx;
    }

    // Generate next N upcoming slots (up to 5)
    const slots: { position: string; dueAt: Date; completed: boolean; completedBy?: string }[] = [];
    const todayEvents = events.filter(e => {
      const d = new Date(e.event_occurred_at);
      return d.toDateString() === now.toDateString();
    });

    for (let i = 1; i <= Math.min(5, positions.length * 2); i++) {
      const posIdx = (lastPositionIdx + i) % positions.length;
      const dueAt = addMinutes(baseTime, intervalMinutes * i);
      // Check if this slot is already completed (position matches an event near that time)
      const matchingEvent = todayEvents.find(e => {
        const eventTime = new Date(e.event_occurred_at);
        return e.position_completed === positions[posIdx].name
          && Math.abs(differenceInMinutes(eventTime, dueAt)) < intervalMinutes / 2;
      });
      slots.push({
        position: positions[posIdx].name,
        dueAt,
        completed: !!matchingEvent,
        completedBy: matchingEvent?.completed_by_name || undefined,
      });
    }

    // Filter to only show upcoming (not past, unless just barely past) — show max 4
    const relevantSlots = slots
      .filter(s => s.dueAt > addMinutes(now, -intervalMinutes) || s.completed)
      .slice(0, 4);

    // Countdown to next uncompleted slot
    const nextSlot = relevantSlots.find(s => !s.completed && s.dueAt > now);
    minutesUntilNext = nextSlot ? differenceInMinutes(nextSlot.dueAt, now) : 0;

    // Status logic
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

    // Compliance
    if (config?.enable_compliance_scoring && events.length > 0) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEvts = events.filter(e => new Date(e.event_occurred_at) >= todayStart);
      const dayMinutes = 16 * 60;
      const expectedCount = Math.floor(dayMinutes / intervalMinutes);
      if (expectedCount > 0) {
        const compliance = Math.round((todayEvts.length / expectedCount) * 100);
        detail = `Today: ${todayEvts.length}/${expectedCount} (${compliance}%)`;
        if (compliance < 70 && status !== 'action') {
          status = 'action';
          statusLabel = 'Low compliance';
        } else if (compliance < 90 && status === 'stable') {
          status = 'monitor';
          statusLabel = 'Monitor compliance';
        }
      }
    }

    return { upcomingSlots: relevantSlots, minutesUntilNext, status, statusLabel, detail };
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
            status === 'monitor' ? 'text-amber-600' : ''
          }`}>
            {statusLabel}
          </div>

          {hasPlan && minutesUntilNext > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium">Next due in: <span className={`${
                minutesUntilNext <= 10 ? 'text-destructive font-bold' :
                minutesUntilNext <= 30 ? 'text-amber-600 font-bold' : 'text-primary'
              }`}>{formatCountdown(minutesUntilNext)}</span></span>
            </div>
          )}

          {hasPlan && minutesUntilNext <= 0 && latestEvent && (
            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
              <Timer className="h-4 w-4" />
              <span>Position change due NOW</span>
            </div>
          )}

          {latestEvent && (
            <p className="text-xs text-muted-foreground">
              Last: {latestEvent.position_completed}
              {latestEvent.completed_by_name && ` • by ${latestEvent.completed_by_name}`}
              {' • '}{formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })}
            </p>
          )}
          {detail && (
            <p className="text-xs text-muted-foreground">{detail}</p>
          )}
        </div>

        {/* Upcoming Positions Schedule */}
        {hasPlan && upcomingSlots.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Upcoming Positions
            </p>
            <div className="space-y-1">
              {upcomingSlots.map((slot, i) => {
                const isPast = slot.dueAt <= now && !slot.completed;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs border ${
                      slot.completed
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                        : isPast
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    {slot.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className={`h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 ${
                        isPast ? 'border-destructive' : 'border-muted-foreground/40'
                      }`} />
                    )}
                    <span className={`flex-1 ${slot.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {slot.position}
                    </span>
                    <span className={`text-[10px] ${
                      slot.completed ? 'text-green-600' :
                      isPast ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {slot.completed
                        ? `✓${slot.completedBy ? ` ${slot.completedBy}` : ''}`
                        : slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button onClick={onLog} className="w-full gap-2" size="sm" disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
          Log Pressure Relief
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 2. Skin Check Tile (unchanged)
 * ────────────────────────────────────────────── */
function SkinCheckTile({
  clientId,
  onLog,
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
  const { sessions } = useSkinChecks(clientId);
  const { config } = usePressureAreaConfig(clientId);

  const latestCheck = sessions[0];

  let status: HealthStatus = 'stable';
  let statusLabel = 'Healthy';
  let statusMessage: string | null = null;

  if (latestCheck) {
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
      const daysSince = differenceInDays(new Date(), new Date(latestCheck.event_occurred_at));
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

  const lastTime = latestCheck
    ? formatDistanceToNow(new Date(latestCheck.event_occurred_at), { addSuffix: true })
    : null;

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
            status === 'monitor' ? 'text-amber-600' : ''
          }`}>
            {statusLabel}
          </div>
          {statusMessage && (
            <p className="text-xs text-muted-foreground">{statusMessage}</p>
          )}
          {lastTime && (
            <p className="text-xs text-muted-foreground">Last checked: {lastTime}</p>
          )}
        </div>

        <Button onClick={onLog} className="w-full gap-2" size="sm" disabled={disabled}>
          <Eye className="h-4 w-4" />
          Log Skin Check
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * Main Grid Component
 * ────────────────────────────────────────────── */
export function PressureAreaStatusCard({ clientId, onLogPressureRelief, onLogSkinCheck, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <PressureReliefTile clientId={clientId} onLog={onLogPressureRelief} disabled={disabled} />
      <SkinCheckTile clientId={clientId} onLog={onLogSkinCheck} disabled={disabled} />
    </div>
  );
}
