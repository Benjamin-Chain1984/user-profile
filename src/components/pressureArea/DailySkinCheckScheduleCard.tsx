/**
 * Daily Skin Check Schedule Card
 * Styled to match the Pressure Relief tile design.
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { CheckCircle2, AlertCircle, Eye, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { HealthStatus } from '@/types/ideal';

interface Props {
  clientId?: string;
  onLogSkinCheck: () => void;
  disabled?: boolean;
}

interface ScheduledSlot {
  time: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  sessionId?: string;
  isOverdue: boolean;
}

export function DailySkinCheckScheduleCard({ clientId, onLogSkinCheck, disabled }: Props) {
  const { config } = usePressureAreaConfig(clientId);
  const { sessions } = useSkinChecks(clientId);

  const scheduledTimes = config?.skin_check_times || [];
  const checksPerDay = config?.skin_checks_per_day || 0;

  const slots: ScheduledSlot[] = useMemo(() => {
    if (!scheduledTimes.length || checksPerDay === 0) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todaySessions = sessions
      .filter(s => new Date(s.event_occurred_at) >= todayStart)
      .sort((a, b) => new Date(a.event_occurred_at).getTime() - new Date(b.event_occurred_at).getTime());

    // Track which sessions have already been matched to avoid double-counting
    const usedSessionIds = new Set<string>();

    return scheduledTimes.slice(0, checksPerDay).map((time) => {
      const [h, m] = time.split(':').map(Number);
      const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

      // 1. Exact match on scheduled_time field
      let matchingSession = todaySessions.find(s => !usedSessionIds.has(s.id) && (s as any).scheduled_time === time);

      // 2. Fallback: time-proximity match (session within ±2 hours of scheduled time)
      if (!matchingSession) {
        matchingSession = todaySessions.find(s => {
          if (usedSessionIds.has(s.id)) return false;
          const sessionTime = new Date(s.event_occurred_at);
          const diffMs = Math.abs(sessionTime.getTime() - scheduledDate.getTime());
          return diffMs <= 2 * 60 * 60 * 1000; // 2 hour window
        });
      }

      if (matchingSession) usedSessionIds.add(matchingSession.id);

      const graceEnd = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000);
      const isOverdue = !matchingSession && now > graceEnd;

      return {
        time,
        completed: !!matchingSession,
        completedAt: matchingSession?.event_occurred_at,
        completedBy: (matchingSession as any)?.created_by_name || undefined,
        sessionId: matchingSession?.id,
        isOverdue,
      };
    });
  }, [scheduledTimes, checksPerDay, sessions]);

  if (checksPerDay === 0 || scheduledTimes.length === 0) return null;

  const completedCount = slots.filter(s => s.completed).length;
  const allComplete = completedCount === slots.length;
  const compliance = Math.round((completedCount / slots.length) * 100);

  // "Back on track" logic: only flag Amber if the NEXT uncompleted slot is
  // currently missed (past its grace window). Historical misses don't keep
  // the card Amber once the person is caught up.
  const nextUncompletedSlot = slots.find(s => !s.completed);
  const isCurrentlyBehind = nextUncompletedSlot?.isOverdue ?? false;

  const computedStatus: HealthStatus = (() => {
    if (allComplete) return 'stable';
    if (isCurrentlyBehind) return 'monitor';
    return 'stable';
  })();

  const statusLabel = allComplete
    ? 'IDEAL'
    : isCurrentlyBehind
    ? 'Missed'
    : 'IDEAL';

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        {/* Header — matches PressureReliefTile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            Daily Skin Checks
          </div>
          <StatusBadge status={computedStatus} size="sm" />
        </div>

        {/* Status + compliance */}
        <div className="space-y-1">
          <div className={`text-lg font-semibold ${
            computedStatus === 'monitor' ? 'text-amber-600' : ''
          }`}>
            {statusLabel}
          </div>
          <p className="text-xs text-muted-foreground">
            Today: {completedCount}/{slots.length} ({compliance}%)
          </p>
        </div>

        {/* Schedule slots — matches PressureReliefTile row style */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Today's Schedule
          </p>
          <div className="space-y-1 max-h-[280px] overflow-y-auto">
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs border ${
                  slot.completed
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                    : slot.isOverdue
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-muted/50 border-border'
                }`}
              >
                {slot.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                ) : slot.isOverdue ? (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 border-muted-foreground/40" />
                )}

                <span className={`flex-1 ${slot.completed ? 'line-through text-muted-foreground' : slot.isOverdue ? 'text-amber-700' : ''}`}>
                  {slot.time} Skin Check
                </span>

                <span className={`text-[10px] whitespace-nowrap ${
                  slot.completed ? 'text-green-600' :
                  slot.isOverdue ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                }`}>
                  {slot.completed && slot.completedAt
                    ? `✓ ${format(parseISO(slot.completedAt), 'HH:mm')}${slot.completedBy ? ` ${slot.completedBy}` : ''}`
                    : slot.isOverdue
                    ? 'Missed'
                    : slot.time
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* IDEAL message or action button */}
        {allComplete ? (
          <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            IDEAL – All scheduled skin checks completed for today
          </div>
        ) : (
          <Button onClick={onLogSkinCheck} className="w-full gap-2" size="sm" disabled={disabled}>
            <Eye className="h-4 w-4" />
            Complete Skin Check
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
