/**
 * Enteral Daily Schedule - Shows today's feeding schedule with completion tracking
 * Supports both grouped feeds (Feed 1, Feed 2...) and standalone flushes
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Droplets, Apple } from 'lucide-react';
import type { FeedingScheduleEntry } from './EnteralFeedingSchedule';
import type { EnteralFeedLog } from '@/types/enteral';

interface EnteralDailyScheduleProps {
  schedule: FeedingScheduleEntry[];
  feedLogs: EnteralFeedLog[];
  flushLogs?: { event_occurred_at: string; flush_volume_ml: number; flush_reason?: string }[];
  graceMinutes?: number;
}

interface ScheduleSlot {
  entry: FeedingScheduleEntry;
  feedNumber?: number;
  dueAt: Date;
  completed: boolean;
  late: boolean;
  missed: boolean;
  completedAt?: Date;
}

function getLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function EnteralDailySchedule({ schedule, feedLogs, flushLogs = [], graceMinutes = 60 }: EnteralDailyScheduleProps) {
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const slots: ScheduleSlot[] = useMemo(() => {
    const graceMs = graceMinutes * 60 * 1000;
    const todayFeedLogs = feedLogs.filter(l => getLocalDateStr(new Date(l.event_occurred_at)) === todayStr);
    const todayFlushLogs = [...flushLogs]
      .filter(l => getLocalDateStr(new Date(l.event_occurred_at)) === todayStr)
      .sort((a, b) => new Date(a.event_occurred_at).getTime() - new Date(b.event_occurred_at).getTime());

    const usedFeedIds = new Set<number>();
    const usedFlushIds = new Set<number>();
    let feedCounter = 0;

    return schedule.map((entry) => {
      const isFeed = (entry.type || 'feed') === 'feed';
      if (isFeed) feedCounter++;
      const feedNumber = isFeed ? feedCounter : undefined;
      const dueAt = new Date(`${todayStr}T${entry.time}:00`);

      let matchedTime: Date | undefined;

      if (isFeed) {
        const idx = todayFeedLogs.findIndex((log, i) => {
          if (usedFeedIds.has(i)) return false;
          if (log.scheduled_time === entry.time) return true;
          const logTime = new Date(log.event_occurred_at);
          return Math.abs(logTime.getTime() - dueAt.getTime()) <= graceMs && log.feed_volume_ml > 0;
        });
        if (idx !== -1) {
          usedFeedIds.add(idx);
          matchedTime = new Date(todayFeedLogs[idx].event_occurred_at);
        }
      } else {
        // Match standalone flush
        const idx = todayFlushLogs.findIndex((log, i) => {
          if (usedFlushIds.has(i)) return false;
          const logTime = new Date(log.event_occurred_at);
          return Math.abs(logTime.getTime() - dueAt.getTime()) <= graceMs && log.flush_volume_ml > 0;
        });
        if (idx !== -1) {
          usedFlushIds.add(idx);
          matchedTime = new Date(todayFlushLogs[idx].event_occurred_at);
        }
      }

      const completed = !!matchedTime;
      const isPastDue = now > dueAt && !completed;
      const minutesOverdue = isPastDue ? (now.getTime() - dueAt.getTime()) / (60 * 1000) : 0;

      return {
        entry,
        feedNumber,
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
            Today's Schedule
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
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {slots.map((slot) => {
            const isFeed = (slot.entry.type || 'feed') === 'feed';

            const statusBg = slot.completed
              ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
              : slot.missed
              ? 'bg-destructive/5 border-destructive/20'
              : slot.late
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-700'
              : isFeed
              ? 'bg-muted/30 border-border'
              : 'bg-blue-50/30 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';

            const statusIcon = slot.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : slot.missed ? (
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            ) : slot.late ? (
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 flex-shrink-0 border-muted-foreground/40" />
            );

            const timeLabel = slot.completed
              ? `✓ ${slot.completedAt!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : slot.missed
              ? `Missed ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : slot.late
              ? `Late ${slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : slot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const timeClass = slot.completed ? 'text-green-600' : slot.missed ? 'text-destructive font-medium' : slot.late ? 'text-amber-600 font-medium' : 'text-muted-foreground';

            if (isFeed) {
              return (
                <div key={slot.entry.id} className={`rounded-lg border p-3 transition-colors ${statusBg}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <Apple className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                      <span className={`text-sm font-semibold ${slot.completed ? 'line-through text-muted-foreground' : slot.missed ? 'text-destructive' : slot.late ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                        Feed {slot.feedNumber}
                      </span>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${timeClass}`}>{timeLabel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded bg-blue-50/80 dark:bg-blue-950/20 px-1.5 py-1">
                      <Droplets className="h-3 w-3 mx-auto text-blue-500" />
                      <p className="text-[10px] text-muted-foreground">Flush</p>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{slot.entry.flush_before_ml} mL</p>
                    </div>
                    <div className="rounded bg-amber-50/80 dark:bg-amber-950/20 px-1.5 py-1">
                      <Apple className="h-3 w-3 mx-auto text-amber-600" />
                      <p className="text-[10px] text-muted-foreground">Feed</p>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{slot.entry.feed_ml} mL</p>
                    </div>
                    <div className="rounded bg-blue-50/80 dark:bg-blue-950/20 px-1.5 py-1">
                      <Droplets className="h-3 w-3 mx-auto text-blue-500" />
                      <p className="text-[10px] text-muted-foreground">Flush</p>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{slot.entry.flush_after_ml} mL</p>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Standalone flush
              return (
                <div key={slot.entry.id} className={`rounded-lg border p-3 transition-colors ${statusBg}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <Droplets className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className={`text-sm font-semibold ${slot.completed ? 'line-through text-muted-foreground' : slot.missed ? 'text-destructive' : slot.late ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
                        Water Flush
                      </span>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{slot.entry.flush_ml || 0} mL</span>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${timeClass}`}>{timeLabel}</span>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </CardContent>
    </Card>
  );
}
