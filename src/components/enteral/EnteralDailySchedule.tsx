/**
 * Enteral Daily Schedule - Today's feeding/flush timeline with completion tracking
 * Reads directly from saved feeding_schedule config entries
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertTriangle, Clock, Droplets, Apple } from 'lucide-react';
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
  label: string;
  dueAt: Date;
  completed: boolean;
  late: boolean;
  missed: boolean;
  completedAt?: Date;
}

function getLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      const label = isFeed ? `Feed ${feedCounter}` : 'Water Flush';
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
        label,
        dueAt,
        completed,
        late: isPastDue && minutesOverdue < graceMinutes,
        missed: isPastDue && minutesOverdue >= graceMinutes,
        completedAt: matchedTime,
      };
    });
  }, [schedule, feedLogs, flushLogs, todayStr, graceMinutes, now]);

  const completedCount = slots.filter(s => s.completed).length;
  const totalCount = slots.length;

  if (totalCount === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Today's Schedule
          </CardTitle>
          <Badge variant={completedCount === totalCount ? 'default' : 'secondary'} className="text-xs font-medium">
            {completedCount} / {totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Timeline */}
        <div className="relative">
          {slots.map((slot, idx) => {
            const isFeed = (slot.entry.type || 'feed') === 'feed';
            const isLast = idx === slots.length - 1;

            return (
              <div key={slot.entry.id} className="relative flex gap-3">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0">
                    {slot.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : slot.missed ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : slot.late ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-[16px] ${slot.completed ? 'bg-green-300 dark:bg-green-700' : 'bg-border'}`} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                  {/* Time + Label row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isFeed ? (
                        <Apple className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <Droplets className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      <span className={`text-sm font-semibold ${
                        slot.completed ? 'text-muted-foreground line-through' : 
                        slot.missed ? 'text-destructive' : 
                        slot.late ? 'text-amber-600 dark:text-amber-400' : 
                        'text-foreground'
                      }`}>
                        {slot.label}
                      </span>
                    </div>
                    <span className={`text-xs font-mono ${
                      slot.completed ? 'text-green-600' :
                      slot.missed ? 'text-destructive' :
                      slot.late ? 'text-amber-600' :
                      'text-muted-foreground'
                    }`}>
                      {slot.completed
                        ? `✓ ${formatTime(slot.completedAt!)}`
                        : slot.missed
                        ? `Missed`
                        : slot.late
                        ? `Due ${formatTime(slot.dueAt)}`
                        : formatTime(slot.dueAt)
                      }
                    </span>
                  </div>

                  {/* Detail row */}
                  {isFeed ? (
                    <div className={`flex gap-1.5 ${slot.completed ? 'opacity-50' : ''}`}>
                      <div className="flex-1 rounded bg-blue-50 dark:bg-blue-950/30 px-2 py-1 text-center">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Flush</p>
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{slot.entry.flush_before_ml}ml</p>
                      </div>
                      <div className="flex-1 rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-center">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Feed</p>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{slot.entry.feed_ml}ml</p>
                      </div>
                      <div className="flex-1 rounded bg-blue-50 dark:bg-blue-950/30 px-2 py-1 text-center">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Flush</p>
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{slot.entry.flush_after_ml}ml</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 ${slot.completed ? 'opacity-50' : ''}`}>
                      <div className="rounded bg-blue-50 dark:bg-blue-950/30 px-3 py-1">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{slot.entry.flush_ml || 0} mL</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
