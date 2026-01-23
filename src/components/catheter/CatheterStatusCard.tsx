/**
 * Catheter Status Card - Visual dashboard summary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Droplets, AlertCircle, Package, Activity } from 'lucide-react';
import { useCatheterStatus, useCatheterConfig, useBagChanges } from '@/hooks/useCatheter';
import { CATHETER_TYPES, CATHETER_TYPE_CONFIG } from '@/types/catheter';
import { format, parseISO } from 'date-fns';

interface CatheterStatusCardProps {
  clientId?: string;
  onLogChange: () => void;
}

export function CatheterStatusCard({ clientId, onLogChange }: CatheterStatusCardProps) {
  const { config } = useCatheterConfig(clientId);
  const {
    status,
    daysUntilChange,
    isChangeOverdue,
    hoursUntilFlush,
    isFlushOverdue,
    lastStomaCheck,
    stomaAlertActive,
    monthlyBagUsage,
    loading,
  } = useCatheterStatus(clientId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const catheterTypeLabel = config?.catheter_type
    ? CATHETER_TYPES.find(t => t.value === config.catheter_type)?.label
    : 'Not configured';

  const typeConfig = config?.catheter_type ? CATHETER_TYPE_CONFIG[config.catheter_type] : null;

  const statusColors = {
    stable: 'bg-green-100 border-green-300 text-green-800',
    monitor: 'bg-amber-100 border-amber-300 text-amber-800',
    action: 'bg-red-100 border-red-300 text-red-800',
  };

  const statusLabels = {
    stable: 'Up to Date',
    monitor: 'Due Soon',
    action: 'Action Required',
  };

  const statusIcons = {
    stable: '🟢',
    monitor: '🟡',
    action: '🔴',
  };

  // Calculate change countdown progress
  const changeProgress = config?.change_frequency_days && daysUntilChange !== null
    ? Math.max(0, Math.min(100, ((config.change_frequency_days - Math.max(0, daysUntilChange)) / config.change_frequency_days) * 100))
    : 0;

  return (
    <Card className={`border-2 ${statusColors[status]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{statusIcons[status]}</span>
            Catheter Status
          </CardTitle>
          <Badge variant="outline" className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Catheter Type */}
        <div className="text-sm text-muted-foreground">
          <strong>Type:</strong> {catheterTypeLabel}
          {config?.catheter_size && ` • ${config.catheter_size}`}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Catheter Change Countdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Next Change
            </div>
            {daysUntilChange !== null ? (
              <>
                <div className={`text-2xl font-bold ${isChangeOverdue ? 'text-red-600' : ''}`}>
                  {isChangeOverdue ? `${Math.abs(daysUntilChange)} days overdue` : `${daysUntilChange} days`}
                </div>
                <Progress value={changeProgress} className="h-2" />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Not scheduled</div>
            )}
          </div>

          {/* Flush Status */}
          {typeConfig?.enableFlushTracking && config?.enable_flush_tracking && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Droplets className="h-4 w-4" />
                Next Flush
              </div>
              {hoursUntilFlush !== null ? (
                <div className={`text-2xl font-bold ${isFlushOverdue ? 'text-red-600' : ''}`}>
                  {isFlushOverdue ? `${Math.abs(hoursUntilFlush)}h overdue` : `${hoursUntilFlush}h`}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No flushes logged</div>
              )}
            </div>
          )}

          {/* Stoma Status */}
          {typeConfig?.enableStomaChecks && config?.enable_stoma_checks && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Stoma Check
              </div>
              {lastStomaCheck ? (
                <>
                  <div className={`text-lg font-semibold ${stomaAlertActive ? 'text-amber-600' : ''}`}>
                    {lastStomaCheck.stoma_condition === 'healthy' ? 'Healthy' : 'Concern Noted'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(lastStomaCheck.event_occurred_at), 'dd MMM, HH:mm')}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No checks logged</div>
              )}
            </div>
          )}

          {/* Bag Usage */}
          {config?.bag_types && config.bag_types.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Bags This Month
              </div>
              <div className="text-2xl font-bold">{monthlyBagUsage}</div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button onClick={onLogChange} className="w-full md:w-auto">
          Log Catheter Change
        </Button>
      </CardContent>
    </Card>
  );
}
