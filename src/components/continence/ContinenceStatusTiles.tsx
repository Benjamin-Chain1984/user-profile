/**
 * Continence Status Tiles — 4 individual tiles modeled after PressureAreaStatusCard
 * Pad Change (with schedule + compliance), Skin Check, Supplies, UTI Test
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import {
  useContinenceConfig,
  usePadChanges,
  useSkinChecks,
  useConsumablesChecks,
  useUTITests,
} from '@/hooks/useContinence';
import { useProfile } from '@/contexts/ProfileContext';
import {
  Clock,
  Timer,
  CheckCircle2,
  AlertCircle,
  Eye,
  Package,
  TestTube,
  Repeat,
  Droplets,
} from 'lucide-react';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  formatDistanceToNow,
  parseISO,
  format,
  addMinutes,
} from 'date-fns';
import type { HealthStatus } from '@/types/ideal';

interface TilesProps {
  clientId?: string;
  onLogPadChange: () => void;
  onLogSkinCheck: () => void;
  onLogConsumables: () => void;
  onLogUTI: () => void;
  disabled?: boolean;
}

/* ─── helpers ─── */
function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'NOW';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ──────────────────────────────────────────────
 * 1. Pad Change Tile — schedule + compliance
 * ────────────────────────────────────────────── */
function PadChangeTile({
  clientId,
  onLog,
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
  const { config } = useContinenceConfig(clientId);
  const { changes } = usePadChanges(clientId);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const latestChange = changes[0];

  const { upcomingSlots, minutesUntilNext, status, statusLabel, detail, compliancePercent } =
    useMemo(() => {
      let status: HealthStatus = 'stable';
      let statusLabel = 'On track';
      let detail: string | null = null;
      let minutesUntilNext = 0;
      let compliancePercent: number | null = null;

      if (!config || config.schedule_type === 'as_required') {
        return {
          upcomingSlots: [] as {
            label: string;
            dueAt: Date;
            completed: boolean;
            completedBy?: string;
          }[],
          minutesUntilNext: 0,
          status: 'stable' as HealthStatus,
          statusLabel: latestChange
            ? 'As required'
            : 'Not yet logged',
          detail: null as string | null,
          compliancePercent: null as number | null,
        };
      }

      // Build today's schedule
      const todayStr = format(now, 'yyyy-MM-dd');
      let scheduledTimes: Date[] = [];

      if (config.schedule_type === 'fixed_times' && config.fixed_times?.length > 0) {
        scheduledTimes = config.fixed_times
          .map((t) => parseISO(`${todayStr}T${t}`))
          .sort((a, b) => a.getTime() - b.getTime());
      } else if (config.schedule_type === 'hourly' && config.interval_hours) {
        // Build slots starting from 06:00
        const dayStart = parseISO(`${todayStr}T06:00`);
        const dayEnd = parseISO(`${todayStr}T22:00`);
        let slot = dayStart;
        while (slot <= dayEnd) {
          scheduledTimes.push(new Date(slot));
          slot = addMinutes(slot, config.interval_hours * 60);
        }
      }

      // Get today's changes
      const todayChanges = changes.filter((c) => {
        const d = new Date(c.event_occurred_at);
        return d.toDateString() === now.toDateString();
      });

      // Build slots with completion status
      const slots = scheduledTimes.map((dueAt) => {
        const dueTimeStr = format(dueAt, 'HH:mm');
        const matchingChange = todayChanges.find((c) => {
          // Primary match: use the scheduled_time field saved on the record
          if ((c as any).scheduled_time) {
            return (c as any).scheduled_time === dueTimeStr;
          }
          // Fallback: time proximity match for legacy entries without scheduled_time
          const t = new Date(c.event_occurred_at);
          const halfInterval =
            config.schedule_type === 'hourly'
              ? (config.interval_hours * 60) / 2
              : 60;
          return Math.abs(differenceInMinutes(t, dueAt)) < halfInterval;
        });
        return {
          label: format(dueAt, 'h:mm a'),
          dueAt,
          completed: !!matchingChange,
          completedBy: undefined as string | undefined,
        };
      });

      // Show ALL slots for the day so staff can see completed, missed, and upcoming
      const relevantSlots = slots;

      // Countdown to next uncompleted
      const nextSlot = slots.find((s) => !s.completed && s.dueAt > now);
      minutesUntilNext = nextSlot
        ? differenceInMinutes(nextSlot.dueAt, now)
        : 0;

      // Overdue logic — only check the MOST RECENTLY DUE slot.
      // If that slot is completed, status is green regardless of earlier compliance.
      // Earlier unmatched slots only show in the compliance detail, not status.
      const slotsDueSoFar = slots.filter((s) => s.dueAt <= now);
      const mostRecentDueSlot = slotsDueSoFar[slotsDueSoFar.length - 1] ?? null;

      if (mostRecentDueSlot && !mostRecentDueSlot.completed) {
        // The current window is overdue — flag amber
        status = 'monitor';
        statusLabel = 'Late';
      }

      // Compliance — informational only (never changes status when current slot is done)
      const completedCount = slotsDueSoFar.filter((s) => s.completed).length;
      if (slotsDueSoFar.length > 0) {
        compliancePercent = Math.round(
          (completedCount / slotsDueSoFar.length) * 100,
        );
        detail = `Today: ${completedCount}/${slotsDueSoFar.length} (${compliancePercent}%)`;
      }

      if (!latestChange && status === 'stable') {
        status = 'monitor';
        statusLabel = 'Not yet logged';
      }

      return {
        upcomingSlots: relevantSlots,
        minutesUntilNext,
        status,
        statusLabel,
        detail,
        compliancePercent,
      };
    }, [config, changes, latestChange, now]);

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Repeat className="h-4 w-4 text-primary" />
            Pad Change
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {/* Status + Countdown */}
        <div className="space-y-1">
          <div
            className={`text-lg font-semibold ${
              status === 'action'
                ? 'text-destructive'
                : status === 'monitor'
                ? 'text-amber-600'
                : ''
            }`}
          >
            {statusLabel}
          </div>

          {minutesUntilNext > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium">
                Next due in:{' '}
                <span
                  className={`${
                    minutesUntilNext <= 10
                      ? 'text-destructive font-bold'
                      : minutesUntilNext <= 30
                      ? 'text-amber-600 font-bold'
                      : 'text-primary'
                  }`}
                >
                  {formatCountdown(minutesUntilNext)}
                </span>
              </span>
            </div>
          )}

          {latestChange && (
            <p className="text-xs text-muted-foreground">
              Last:{' '}
              {formatDistanceToNow(new Date(latestChange.event_occurred_at), {
                addSuffix: true,
              })}
            </p>
          )}
          {detail && (
            <p className="text-xs text-muted-foreground">{detail}</p>
          )}
        </div>

        {/* Compliance bar */}
        {compliancePercent !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Compliance</span>
              <span
                className={`font-semibold ${
                  compliancePercent >= 90
                    ? 'text-green-600'
                    : compliancePercent >= 70
                    ? 'text-amber-600'
                    : 'text-destructive'
                }`}
              >
                {compliancePercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  compliancePercent >= 90
                    ? 'bg-green-500'
                    : compliancePercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-destructive'
                }`}
                style={{ width: `${Math.min(100, compliancePercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Upcoming Schedule */}
        {upcomingSlots.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Today's Schedule
            </p>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
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
                    ) : isPast ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 border-muted-foreground/40" />
                    )}
                    <span className={`flex-1 ${slot.completed ? 'line-through text-muted-foreground' : isPast ? 'text-destructive' : ''}`}>
                      Pad Change
                    </span>
                    <span
                      className={`text-[10px] whitespace-nowrap ${
                        slot.completed ? 'text-green-600' :
                        isPast ? 'text-destructive font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {slot.completed
                        ? `✓ ${slot.label}`
                        : isPast
                        ? `Missed ${slot.label}`
                        : slot.label
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button
          onClick={onLog}
          className="w-full gap-2"
          size="sm"
          disabled={disabled}
        >
          <Repeat className="h-4 w-4" />
          Log Pad Change
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 2. Skin Check Tile
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
  const { config } = useContinenceConfig(clientId);
  const { checks, lastCheck } = useSkinChecks(clientId);
  const { changes } = usePadChanges(clientId);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const skinCheckFrequency = (config as any)?.skin_check_frequency || 'every_pad_change';

  // Calculate required checks and overdue status based on frequency
  const { intervalHours, frequencyLabel, isOverdue, hoursUntilDue, checksRequiredToday, checksCompletedToday, missedPadChanges } =
    useMemo(() => {
      const todayChecks = checks.filter(
        (c) => new Date(c.event_occurred_at).toDateString() === now.toDateString(),
      );
      const checksCompletedToday = todayChecks.length;

      let intervalHours = 24;
      let frequencyLabel = 'Daily';
      let checksRequiredToday = 1;
      let missedPadChanges = 0;

      switch (skinCheckFrequency) {
        case 'daily':
          intervalHours = 24;
          frequencyLabel = 'Daily';
          checksRequiredToday = 1;
          break;
        case 'twice_daily':
          intervalHours = 12;
          frequencyLabel = 'Twice daily';
          checksRequiredToday = 2;
          break;
        case 'three_times_daily':
          intervalHours = 8;
          frequencyLabel = 'Three times daily';
          checksRequiredToday = 3;
          break;
        case 'every_pad_change': {
          // Each pad change should have a paired skin check.
          // A skin check is considered paired if it occurred within 60 mins after a pad change.
          const todayPadChanges = changes.filter(
            (c) => new Date(c.event_occurred_at).toDateString() === now.toDateString(),
          );
          checksRequiredToday = todayPadChanges.length;
          intervalHours = 0; // Not time-based

          // Count pad changes that don't have a paired skin check.
          // Give a 30-min grace window for very recent pad changes (skin check still pending, not missed).
          missedPadChanges = todayPadChanges.filter((padChange) => {
            const padTime = new Date(padChange.event_occurred_at).getTime();
            const minutesSincePad = (now.getTime() - padTime) / 60_000;
            // Within 30-min grace window → pending, not missed yet
            if (minutesSincePad < 30) return false;
            const hasPairedCheck = todayChecks.some((check) => {
              const checkTime = new Date(check.event_occurred_at).getTime();
              return checkTime >= padTime && checkTime <= padTime + 60 * 60 * 1000;
            });
            return !hasPairedCheck;
          }).length;

          frequencyLabel = 'Every pad change';
          break;
        }
      }

      const hoursSinceLastCheck = lastCheck
        ? differenceInHours(now, new Date(lastCheck.event_occurred_at))
        : null;

      let isOverdue = false;
      let hoursUntilDue = 0;

      if (skinCheckFrequency === 'every_pad_change') {
        // Overdue if there are pad changes today without a paired skin check
        isOverdue = missedPadChanges > 0;
      } else {
        isOverdue = hoursSinceLastCheck !== null && hoursSinceLastCheck >= intervalHours;
        hoursUntilDue = lastCheck
          ? Math.max(0, intervalHours - (hoursSinceLastCheck || 0))
          : 0;
      }

      return { intervalHours, frequencyLabel, isOverdue, hoursUntilDue, checksRequiredToday, checksCompletedToday, missedPadChanges };
    }, [config, checks, changes, lastCheck, now, skinCheckFrequency]);

  let status: HealthStatus = 'stable';
  let statusLabel = 'Healthy';
  let statusMessage: string | null = null;

  // Clinical findings from last check take highest priority
  if (lastCheck) {
    if (['broken_skin', 'fungal_signs'].includes(lastCheck.skin_condition)) {
      status = 'action';
      statusLabel = 'Action Required';
      statusMessage = 'Active concern – seek medical advice';
    } else if (['redness', 'rash', 'moisture_damage'].includes(lastCheck.skin_condition)) {
      status = 'monitor';
      statusLabel = 'Monitor';
      statusMessage = 'Skin changes identified';
    }
  } else {
    status = 'monitor';
    statusLabel = 'Not yet logged';
    statusMessage = 'No skin checks recorded';
  }

  // Overdue check (only escalates status, doesn't downgrade clinical findings)
  if (isOverdue && status === 'stable') {
    status = 'monitor';
    if (skinCheckFrequency === 'every_pad_change') {
      statusLabel = 'Check Missed';
      statusMessage = `${missedPadChanges} pad change${missedPadChanges > 1 ? 's' : ''} without skin check`;
    } else {
      statusLabel = 'Overdue';
      statusMessage = lastCheck
        ? `Last check ${differenceInHours(now, new Date(lastCheck.event_occurred_at))}h ago`
        : null;
    }
  } else if (isOverdue && status !== 'action') {
    // Already flagged clinical finding but also missed — add note
    if (skinCheckFrequency === 'every_pad_change' && missedPadChanges > 0) {
      statusMessage = `${statusMessage ? statusMessage + ' · ' : ''}${missedPadChanges} check${missedPadChanges > 1 ? 's' : ''} missed`;
    }
  }

  const lastTime = lastCheck
    ? formatDistanceToNow(new Date(lastCheck.event_occurred_at), { addSuffix: true })
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
          <div
            className={`text-lg font-semibold ${
              status === 'action'
                ? 'text-destructive'
                : status === 'monitor'
                ? 'text-amber-600'
                : ''
            }`}
          >
            {statusLabel}
          </div>
          <p className="text-xs text-muted-foreground">
            Frequency: {frequencyLabel}
          </p>
          {statusMessage && (
            <p className={`text-xs ${status === 'action' ? 'text-destructive' : status === 'monitor' ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {statusMessage}
            </p>
          )}
          {/* Per-pad-change progress */}
          {skinCheckFrequency === 'every_pad_change' && checksRequiredToday > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Today: {checksCompletedToday}/{checksRequiredToday} checks
              </p>
              {missedPadChanges > 0 && (
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, (checksCompletedToday / Math.max(checksRequiredToday, 1)) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {/* Countdown for time-based frequencies */}
          {lastCheck && hoursUntilDue > 0 && skinCheckFrequency !== 'every_pad_change' && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium">
                Next due in:{' '}
                <span className="text-primary">
                  {formatCountdown(Math.round(hoursUntilDue * 60))}
                </span>
              </span>
            </div>
          )}
          {lastTime && (
            <p className="text-xs text-muted-foreground">
              Last checked: {lastTime}
            </p>
          )}
        </div>

        <Button
          onClick={onLog}
          className="w-full gap-2"
          size="sm"
          disabled={disabled}
        >
          <Eye className="h-4 w-4" />
          Log Skin Check
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 3. Supplies / Consumables Tile
 * ────────────────────────────────────────────── */
function SuppliesTile({
  clientId,
  onLog,
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
  const { lastCheck, hasLowStock } = useConsumablesChecks(clientId);

  // Categorize items by level
  const lowItems: string[] = [];
  const mediumItems: string[] = [];
  if (lastCheck) {
    const items: { key: keyof typeof lastCheck; label: string }[] = [
      { key: 'continence_pads_level', label: 'Pads' },
      { key: 'barrier_creams_level', label: 'Cream' },
      { key: 'gloves_wipes_level', label: 'Gloves/Wipes' },
      { key: 'cleansing_products_level', label: 'Cleansing' },
      { key: 'disposable_sheets_level', label: 'Sheets' },
    ];
    for (const item of items) {
      if (lastCheck[item.key] === 'low') lowItems.push(item.label);
      else if (lastCheck[item.key] === 'medium') mediumItems.push(item.label);
    }
  }

  const hasMediumStock = mediumItems.length > 0;

  let status: HealthStatus = 'stable';
  let statusLabel = 'Stocked';

  if (!lastCheck) {
    status = 'monitor';
    statusLabel = 'Not checked';
  } else if (hasLowStock) {
    status = 'action';
    statusLabel = 'Low stock';
  } else if (hasMediumStock) {
    status = 'monitor';
    statusLabel = 'Monitor stock';
  }

  const lastTime = lastCheck
    ? formatDistanceToNow(parseISO(lastCheck.check_date), { addSuffix: true })
    : null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-primary" />
            Supplies
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-1">
          <div
            className={`text-lg font-semibold ${
              status === 'action'
                ? 'text-destructive'
                : status === 'monitor'
                ? 'text-amber-600'
                : ''
            }`}
          >
            {statusLabel}
          </div>
          {lowItems.length > 0 && (
            <p className="text-xs text-destructive">
              Low: {lowItems.join(', ')}
            </p>
          )}
          {mediumItems.length > 0 && (
            <p className="text-xs text-amber-600">
              Medium: {mediumItems.join(', ')}
            </p>
          )}
          {lastTime && (
            <p className="text-xs text-muted-foreground">
              Last check: {lastTime}
            </p>
          )}
        </div>

        <Button
          onClick={onLog}
          className="w-full gap-2"
          size="sm"
          disabled={disabled}
        >
          <Package className="h-4 w-4" />
          Stock Check
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 4. UTI Test Tile
 * ────────────────────────────────────────────── */
function UTITestTile({
  clientId,
  onLog,
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
  const { lastTest, hasPositiveUTI } = useUTITests(clientId);
  const { config } = useContinenceConfig(clientId);

  let status: HealthStatus = 'stable';
  let statusLabel = 'Clear';

  if (!lastTest) {
    status = 'monitor';
    statusLabel = 'Not tested';
  } else if (hasPositiveUTI) {
    status = 'action';
    statusLabel = 'Positive – Escalate';
  }

  // Countdown based on testing frequency
  let hoursUntilDue: number | null = null;
  if (lastTest && config?.uti_testing_frequency && config.uti_testing_frequency !== 'if_symptoms') {
    const lastDate = parseISO(lastTest.test_date);
    const frequencyHours =
      config.uti_testing_frequency === 'weekly'
        ? 168
        : config.uti_testing_frequency === 'fortnightly'
        ? 336
        : config.uti_testing_frequency === 'twice_weekly'
        ? 84
        : 0;
    if (frequencyHours > 0) {
      const hoursSince = differenceInHours(new Date(), lastDate);
      hoursUntilDue = Math.max(0, frequencyHours - hoursSince);
      if (hoursUntilDue === 0 && status === 'stable') {
        status = 'monitor';
        statusLabel = 'Test due';
      }
    }
  }

  const lastTime = lastTest
    ? formatDistanceToNow(parseISO(lastTest.test_date), { addSuffix: true })
    : null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TestTube className="h-4 w-4 text-primary" />
            UTI Test
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-1">
          <div
            className={`text-lg font-semibold ${
              status === 'action'
                ? 'text-destructive'
                : status === 'monitor'
                ? 'text-amber-600'
                : ''
            }`}
          >
            {statusLabel}
          </div>
          {hoursUntilDue !== null && hoursUntilDue > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-medium">
                Next due in:{' '}
                <span className="text-primary">
                  {hoursUntilDue > 24
                    ? `${Math.round(hoursUntilDue / 24)}d`
                    : formatCountdown(Math.round(hoursUntilDue * 60))}
                </span>
              </span>
            </div>
          )}
          {lastTime && (
            <p className="text-xs text-muted-foreground">
              Last test: {lastTime}
            </p>
          )}
        </div>

        <Button
          onClick={onLog}
          className="w-full gap-2"
          size="sm"
          disabled={disabled}
        >
          <TestTube className="h-4 w-4" />
          Log UTI Test
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 5. Fluid Balance Tile (read-only)
 * ────────────────────────────────────────────── */
function FluidBalanceTile({ clientId }: { clientId?: string }) {
  const { getModuleStatus } = useProfile();
  const fluidModule = getModuleStatus('fluid-balance');

  const status: HealthStatus = fluidModule?.status || 'stable';
  const message = fluidModule?.lastEntry || 'No data available';

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Droplets className="h-4 w-4 text-primary" />
            Fluid Balance
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-1">
          <div
            className={`text-lg font-semibold ${
              status === 'action'
                ? 'text-destructive'
                : status === 'monitor'
                ? 'text-amber-600'
                : ''
            }`}
          >
            {message}
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Refer to Fluid Balance Module to update data.
        </p>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * Main Grid
 * ────────────────────────────────────────────── */
export function ContinenceStatusTiles({
  clientId,
  onLogPadChange,
  onLogSkinCheck,
  onLogConsumables,
  onLogUTI,
  disabled,
}: TilesProps) {
  const { config } = useContinenceConfig(clientId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <PadChangeTile
        clientId={clientId}
        onLog={onLogPadChange}
        disabled={disabled}
      />
      <SkinCheckTile
        clientId={clientId}
        onLog={onLogSkinCheck}
        disabled={disabled}
      />
      {config?.enable_consumables_monitoring && (
        <SuppliesTile
          clientId={clientId}
          onLog={onLogConsumables}
          disabled={disabled}
        />
      )}
      {config?.enable_uti_testing && (
        <UTITestTile
          clientId={clientId}
          onLog={onLogUTI}
          disabled={disabled}
        />
      )}
      {config?.enable_hydration_link && (
        <FluidBalanceTile clientId={clientId} />
      )}
    </div>
  );
}