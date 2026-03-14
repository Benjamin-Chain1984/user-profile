/**
 * Enteral Daily Schedule - Shows today's feeding schedule with completion tracking
 * Similar to Pressure Area repositioning schedule with strikethrough for completed items
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Droplets, Apple } from 'lucide-react';
import type { FeedingScheduleEntry } from './EnteralFeedingSchedule';
import type { EnteralFeedLog } from '@/types/enteral';

interface FlushLog {
  event_occurred_at: string;
  flush_volume_ml: number;
  flush_reason?: string;
}

interface ScheduleSlot {
  entry: FeedingScheduleEntry;
  dueAt: Date;
  completed: boolean;
  late: boolean;
  missed: boolean;
  completedAt?: Date;
}

interface EnteralDailyScheduleProps {
  schedule: FeedingScheduleEntry[];
  feedLogs: EnteralFeedLog[];
  flushLogs?: FlushLog[];
  graceMinutes?: number;
}

const ACTIVITY_META: Record<string, { label: string; icon: typeof Droplets; colorClass: string }> = {
  water_flush: { label: 'Water Flush', icon: Droplets, colorClass: 'text-blue-500' },
  formula_feed: { label: 'Formula Feed', icon: Apple, colorClass: 'text-amber-600' },
};

function getLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function EnteralDailySchedule({ schedule, feedLogs, flushLogs = [], graceMinutes = 60 }: EnteralDailyScheduleProps) {
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const slots: ScheduleSlot[] = useMemo(() => {
    const graceMs = graceMinutes * 60 * 1000;

    // Today's feed logs
    const todayFeedLogs = feedLogs.filter(l => getLocalDateStr(new Date(l.event_occurred_at)) === todayStr);

    // Today's flush logs
    const todayFlushLogs = flushLogs.filter(l => getLocalDateStr(new Date(l.event_occurred_at)) === todayStr);

    // Sort flush logs chronologically for ordered matching to schedule slots
    const sortedFlushLogs = [...todayFlushLogs].sort(
      (a, b) => new Date(a.event_occurred_at).getTime() - new Date(b.event_occurred_at).getTime()
    );

    // Track which logs have already been matched so each log only satisfies one slot
    const usedFeedLogIds = new Set<number>();
    const usedFlushLogIdx = new Set<number>();

    return schedule.map(entry => {
      const dueAt = new Date(`${todayStr}T${entry.time}:00`);

      let matchedTime: Date | undefined;

      if (entry.activity === 'formula_feed') {
        // Match from feed logs — by scheduled_time field or grace window
        const idx = todayFeedLogs.findIndex((log, i) => {
          if (usedFeedLogIds.has(i)) return false;
          if (log.scheduled_time === entry.time) return true;
          const logTime = new Date(log.event_occurred_at);
          return Math.abs(logTime.getTime() - dueAt.getTime()) <= graceMs && log.feed_volume_ml > 0;
        });
        if (idx !== -1) {
          usedFeedLogIds.add(idx);
          matchedTime = new Date(todayFeedLogs[idx].event_occurred_at);
        }
      } else {
        // water_flush — match next available flush log (in chronological order)
        // This allows late-logged flushes to still satisfy earlier schedule slots
        const flushIdx = sortedFlushLogs.findIndex((log, i) => {
          if (usedFlushLogIdx.has(i)) return false;
          return log.flush_volume_ml > 0;
        });
        if (flushIdx !== -1) {
          usedFlushLogIdx.add(flushIdx);
          matchedTime = new Date(sortedFlushLogs[flushIdx].event_occurred_at);
        }
      }

      const completed = !!matchedTime;
      const isPastDue = now > dueAt && !completed;
      const minutesOverdue = isPastDue ? (now.getTime() - dueAt.getTime()) / (60 * 1000) : 0;

      return {
        entry,
        dueAt,
        completed,
        late: isPastDue && minutesOverdue < graceMinutes,
        missed: isPastDue && minutesOverdue >= graceMinutes,
        completedAt: matchedTime,
      };
    });
  }, [schedule, feedLogs, flushLogs, todayStr, graceMinutes, now]);

  const completedCount = slots.filter(s => s.completed).length;
  const missedCount = slots.filter(s => s.missed).length;
  const lateCount = slots.filter(s => s.late).length;

  if (schedule.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Today's Feeding Schedule
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{slots.length} completed
          </Badge>
        </div>
        {(missedCount > 0 || lateCount > 0) && (
          <div className="flex gap-2 mt-1">
            {lateCount > 0 && (
              <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700">
                {lateCount} late
              </Badge>
            )}
            {missedCount > 0 && (
              <Badge variant="outline" className="text-xs border-destructive/30 bg-destructive/5 text-destructive">
                {missedCount} missed
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[350px] overflow-y-auto">
          {slots.map((slot, i) => {
            const meta = ACTIVITY_META[slot.entry.activity] || ACTIVITY_META.water_flush;
            const Icon = meta.icon;

            return (
              <div
                key={`${slot.entry.id}-${i}`}
                className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm border transition-colors ${
                  slot.completed
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                    : slot.missed
                    ? 'bg-destructive/5 border-destructive/20'
                    : slot.late
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-700'
                    : 'bg-muted/50 border-border'
                }`}
              >
                {/* Status icon */}
                {slot.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : slot.missed ? (
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                ) : slot.late ? (
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 flex-shrink-0 border-muted-foreground/40" />
                )}

                {/* Activity icon */}
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${meta.colorClass}`} />

                {/* Activity label */}
                <span className={`flex-1 ${
                  slot.completed
                    ? 'line-through text-muted-foreground'
                    : slot.missed
                    ? 'text-destructive font-medium'
                    : slot.late
                    ? 'text-amber-700 dark:text-amber-400 font-medium'
                    : ''
                }`}>
                  {meta.label}
                  <span className="ml-1 text-xs text-muted-foreground">({slot.entry.amount_ml}mL)</span>
                </span>

                {/* Time / status */}
                <span className={`text-xs whitespace-nowrap ${
                  slot.completed
                    ? 'text-green-600'
                    : slot.missed
                    ? 'text-destructive font-medium'
                    : slot.late
                    ? 'text-amber-600 font-medium'
                    : 'text-muted-foreground'
                }`}>
                  {slot.completed
                    ? `✓ ${slot.completedAt!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (due ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                    : slot.missed
                    ? `Missed ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : slot.late
                    ? `Late ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
