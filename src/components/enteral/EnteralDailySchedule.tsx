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

interface ScheduleSlot {
  entry: FeedingScheduleEntry;
  dueAt: Date;
  completed: boolean;
  late: boolean;       // past due by < 1 hour (amber)
  missed: boolean;     // past due by >= 1 hour
  completedAt?: Date;
}

interface EnteralDailyScheduleProps {
  schedule: FeedingScheduleEntry[];
  feedLogs: EnteralFeedLog[];
  graceMinutes?: number;
}

const ACTIVITY_META: Record<string, { label: string; icon: typeof Droplets; colorClass: string }> = {
  water_flush: { label: 'Water Flush', icon: Droplets, colorClass: 'text-blue-500' },
  formula_feed: { label: 'Formula Feed', icon: Apple, colorClass: 'text-amber-600' },
};

export function EnteralDailySchedule({ schedule, feedLogs, graceMinutes = 60 }: EnteralDailyScheduleProps) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const slots: ScheduleSlot[] = useMemo(() => {
    // Build today's feed logs for matching
    const todayLogs = feedLogs.filter(l => {
      const d = new Date(l.event_occurred_at);
      return d.toISOString().split('T')[0] === todayStr;
    });

    return schedule.map(entry => {
      const dueAt = new Date(`${todayStr}T${entry.time}:00`);
      const graceMs = graceMinutes * 60 * 1000;

      // Match: a feed log within ±grace window of the scheduled time
      // For formula_feed, match feed logs; for water_flush, match flush volume
      const matchedLog = todayLogs.find(log => {
        const logTime = new Date(log.event_occurred_at);
        const timeDiff = Math.abs(logTime.getTime() - dueAt.getTime());
        if (timeDiff > graceMs) return false;

        if (entry.activity === 'formula_feed') {
          return log.feed_volume_ml > 0;
        } else {
          return log.flush_given_ml > 0;
        }
      });

      const completed = !!matchedLog;
      const isPastDue = now > dueAt && !completed;
      const minutesOverdue = isPastDue ? (now.getTime() - dueAt.getTime()) / (60 * 1000) : 0;

      return {
        entry,
        dueAt,
        completed,
        late: isPastDue && minutesOverdue < graceMinutes,
        missed: isPastDue && minutesOverdue >= graceMinutes,
        completedAt: matchedLog ? new Date(matchedLog.event_occurred_at) : undefined,
      };
    });
  }, [schedule, feedLogs, todayStr, graceMinutes, now]);

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
            const isFuture = slot.dueAt > now && !slot.completed;

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
                    ? `✓ ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
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
