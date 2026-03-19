/**
 * Continence Status Card - Uses shared TrafficLightStatusCard
 * Matches Bowel Care status card design pattern.
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle, Timer } from 'lucide-react';
import { useContinenceStatus } from '@/hooks/useContinence';
import { formatDistanceToNow, format } from 'date-fns';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface ContinenceStatusCardProps {
  clientId?: string;
  onLogPadChange: () => void;
}

export function ContinenceStatusCard({ clientId, onLogPadChange }: ContinenceStatusCardProps) {
  const status = useContinenceStatus(clientId);
  const trafficLight = toTrafficLight(status.status);

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(Math.abs(mins) / 60);
    const minutes = Math.abs(mins) % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const statusMessage = status.lastPadChange
    ? `Last pad change ${formatDistanceToNow(new Date(status.lastPadChange.event_occurred_at), { addSuffix: true })}`
    : 'No pad changes logged yet';

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusMessage}
      lastUpdated={status.lastPadChange?.event_occurred_at}
    >
      {/* Module-specific details */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {status.nextScheduledChange && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-10 rounded-lg bg-background/50 p-1 flex items-center justify-center">
                <Timer className="h-5 w-5 opacity-70" />
              </div>
              <span className="text-xs opacity-70">
                {format(status.nextScheduledChange, 'h:mm a')}
              </span>
            </div>
          )}
          {status.isOverdue ? (
            <div className="text-sm">
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue by {formatMinutes(status.overdueMinutes)}
              </Badge>
            </div>
          ) : status.minutesUntilNext !== null && status.minutesUntilNext > 0 ? (
            <div className="text-sm">
              <span className="font-semibold">{formatMinutes(status.minutesUntilNext)}</span>
              <span className="opacity-70"> until next scheduled change</span>
            </div>
          ) : null}
        </div>
        {status.performanceScore > 0 && (
          <div className="text-right">
            <span className={`text-lg font-bold ${
              status.performanceScore >= 80 ? 'text-success' :
              status.performanceScore >= 60 ? 'text-warning' : 'text-destructive'
            }`}>
              {status.performanceScore}%
            </span>
            <p className="text-xs opacity-60">Weekly score</p>
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {(status.skinAlerts.length > 0 || status.consumableAlerts.length > 0 || status.utiAlerts.length > 0) && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="text-sm font-medium mb-2">
            Active Alerts ({status.skinAlerts.length + status.consumableAlerts.length + status.utiAlerts.length})
          </div>
          <ul className="space-y-1">
            {status.skinAlerts.map((a) => (
              <li key={a.id} className="text-sm opacity-80">• {a.message}</li>
            ))}
            {status.consumableAlerts.map((a) => (
              <li key={a.id} className="text-sm opacity-80">• {a.message}</li>
            ))}
            {status.utiAlerts.map((a) => (
              <li key={a.id} className="text-sm opacity-80">• {a.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance */}
      <div className="mt-3 pt-3 border-t border-current/10">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {status.status === 'stable' && 'Continue regular pad change schedule. Monitor skin integrity at each change.'}
          {status.status === 'monitor' && 'Review pad change frequency. Check skin for early signs of irritation. Ensure barrier cream is applied.'}
          {status.status === 'action' && 'Attend to overdue pad change. Escalate skin concerns. Follow the person\'s continence care plan.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Continence schedules and skin protocols should be determined by a qualified health professional.
      </p>
    </TrafficLightStatusCard>
  );
}