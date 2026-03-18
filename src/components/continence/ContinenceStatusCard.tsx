/**
 * Continence Status Card - Uses shared TrafficLightStatusCard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle, Timer } from 'lucide-react';
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
    ? `Last change ${formatDistanceToNow(new Date(status.lastPadChange.event_occurred_at), { addSuffix: true })}`
    : 'No pad changes logged yet';

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusMessage}
      lastUpdated={status.lastPadChange?.event_occurred_at}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Continence Status</span>
        <Button onClick={onLogPadChange} size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          Log Pad Change
        </Button>
      </div>

      {/* Countdown Timer */}
      {status.nextScheduledChange && (
        <div className="bg-background/80 rounded-lg p-4 border mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Next Scheduled Change</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(status.nextScheduledChange, 'h:mm a')}
            </span>
          </div>
          {status.isOverdue ? (
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue by {formatMinutes(status.overdueMinutes)}
              </Badge>
              <Progress value={100} className="w-32 h-2" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {formatMinutes(status.minutesUntilNext || 0)} remaining
              </span>
              <Progress
                value={Math.max(0, Math.min(100, ((status.minutesUntilNext || 0) / 240) * 100))}
                className="w-32 h-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Performance Score */}
      <div className="flex items-center justify-between bg-background/80 rounded-lg p-4 border mb-3">
        <div>
          <span className="text-sm font-medium">Weekly Care Score</span>
          <p className="text-xs text-muted-foreground">Based on scheduled changes completed this week</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${
            status.performanceScore >= 80 ? 'text-success' :
            status.performanceScore >= 60 ? 'text-warning' : 'text-destructive'
          }`}>
            {status.performanceScore}%
          </span>
        </div>
      </div>

      {/* Active Alerts Summary */}
      {(status.skinAlerts.length > 0 || status.consumableAlerts.length > 0 || status.utiAlerts.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {status.skinAlerts.length > 0 && (
            <Badge variant="destructive">{status.skinAlerts.length} Skin Alert(s)</Badge>
          )}
          {status.consumableAlerts.length > 0 && (
            <Badge variant="secondary">{status.consumableAlerts.length} Low Stock Alert(s)</Badge>
          )}
          {status.utiAlerts.length > 0 && (
            <Badge variant="destructive">{status.utiAlerts.length} UTI Alert(s)</Badge>
          )}
        </div>
      )}
    </TrafficLightStatusCard>
  );
}
