/**
 * Daily Skin Check Schedule Card
 * Shows scheduled skin check times with completion status for today.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { CheckCircle2, Circle, AlertCircle, Eye, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  clientId?: string;
  onLogSkinCheck: () => void;
  disabled?: boolean;
}

interface ScheduledSlot {
  time: string; // e.g. "08:00"
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

    // Get today's sessions sorted by time
    const todaySessions = sessions
      .filter(s => new Date(s.event_occurred_at) >= todayStart)
      .sort((a, b) => new Date(a.event_occurred_at).getTime() - new Date(b.event_occurred_at).getTime());

    // For each scheduled time, try to match with a session
    return scheduledTimes.slice(0, checksPerDay).map((time) => {
      const [h, m] = time.split(':').map(Number);
      const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

      // Match: find a session that has this scheduled_time, or the closest one
      const matchingSession = todaySessions.find(s => (s as any).scheduled_time === time);

      // Grace window: 2 hours after scheduled time
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
  const remainingCount = slots.length - completedCount;
  const allComplete = remainingCount === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Daily Skin Checks
          </CardTitle>
          <Badge
            variant="outline"
            className={allComplete
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
            }
          >
            {completedCount} completed / {remainingCount} remaining
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm border ${
              slot.completed
                ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                : slot.isOverdue
                ? 'bg-destructive/5 border-destructive/20'
                : 'bg-muted/30 border-border'
            }`}
          >
            {slot.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : slot.isOverdue ? (
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            )}

            <span className={`flex-1 font-medium ${slot.completed ? 'line-through text-muted-foreground' : slot.isOverdue ? 'text-amber-700' : ''}`}>
              {slot.time} Skin Check
            </span>

            {slot.completed && slot.completedAt && (
              <span className="text-xs text-green-600">
                ✓ {format(parseISO(slot.completedAt), 'HH:mm')}
                {slot.completedBy && ` • ${slot.completedBy}`}
              </span>
            )}

            {slot.isOverdue && (
              <span className="text-xs text-amber-600 font-medium">Missed</span>
            )}
          </div>
        ))}

        {!allComplete && (
          <Button onClick={onLogSkinCheck} className="w-full gap-2 mt-2" size="sm" disabled={disabled}>
            <Eye className="h-4 w-4" />
            Complete Skin Check
          </Button>
        )}

        {allComplete && (
          <div className="flex items-center gap-2 pt-1 text-sm text-green-700 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            IDEAL – All scheduled skin checks completed for today
          </div>
        )}
      </CardContent>
    </Card>
  );
}
