/**
 * Continence Status Card - Shows current status and countdown timer
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertTriangle, AlertCircle, Timer } from 'lucide-react';
import { useContinenceStatus } from '@/hooks/useContinence';
import { formatDistanceToNow, format } from 'date-fns';

interface ContinenceStatusCardProps {
  clientId?: string;
  onLogPadChange: () => void;
}

export function ContinenceStatusCard({ clientId, onLogPadChange }: ContinenceStatusCardProps) {
  const status = useContinenceStatus(clientId);

  const statusConfig = {
    stable: {
      label: 'IDEAL',
      color: 'bg-green-500',
      icon: CheckCircle,
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    monitor: {
      label: 'Monitor',
      color: 'bg-amber-500',
      icon: AlertTriangle,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    action: {
      label: 'Action Needed',
      color: 'bg-red-500',
      icon: AlertCircle,
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status.status];
  const StatusIcon = config.icon;

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(Math.abs(mins) / 60);
    const minutes = Math.abs(mins) % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.color}`}>
              <StatusIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className={`text-lg ${config.textColor}`}>
                Continence Status: {config.label}
              </CardTitle>
              <CardDescription>
                {status.lastPadChange
                  ? `Last change ${formatDistanceToNow(new Date(status.lastPadChange.event_occurred_at), { addSuffix: true })}`
                  : 'No pad changes logged yet'}
              </CardDescription>
            </div>
          </div>
          <Button onClick={onLogPadChange} size="lg" className="gap-2">
            <Clock className="h-4 w-4" />
            Log Pad Change
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown Timer */}
        {status.nextScheduledChange && (
          <div className="bg-white/80 rounded-lg p-4 border">
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
                <span className={`text-lg font-bold ${config.textColor}`}>
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
        <div className="flex items-center justify-between bg-white/80 rounded-lg p-4 border">
          <div>
            <span className="text-sm font-medium">Weekly Care Score</span>
            <p className="text-xs text-muted-foreground">
              Based on scheduled changes completed this week
            </p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${
              status.performanceScore >= 80 ? 'text-green-600' :
              status.performanceScore >= 60 ? 'text-amber-600' : 'text-red-600'
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
      </CardContent>
    </Card>
  );
}
