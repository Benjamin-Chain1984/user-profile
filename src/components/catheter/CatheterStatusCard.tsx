/**
 * Catheter Status Card - Visual dashboard summary
 * Now pulls catheter type/size from the Digital Care Plan as single source of truth.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Droplets, Activity, Package } from 'lucide-react';
import { useCatheterStatus, useBagChanges } from '@/hooks/useCatheter';
import { useCatheterCarePlan } from '@/hooks/useCatheterCarePlan';
import { CATHETER_TYPES, CATHETER_TYPE_CONFIG, type CatheterType } from '@/types/catheter';
import { format, parseISO } from 'date-fns';

interface CatheterStatusCardProps {
  clientId?: string;
  onLogChange: () => void;
  onLogFlush?: () => void;
}

export function CatheterStatusCard({ clientId, onLogChange, onLogFlush }: CatheterStatusCardProps) {
  const { plan } = useCatheterCarePlan(clientId);
  const {
    status,
    daysUntilChange,
    isChangeOverdue,
    daysUntilFlush,
    isFlushOverdue,
    lastStomaCheck,
    stomaAlertActive,
    monthlyBagUsage,
    changeFrequencyDays,
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

  // Pull catheter type/size from the Digital Care Plan
  const planCatheterType = plan?.catheter_type as CatheterType | undefined;
  const catheterTypeLabel = planCatheterType
    ? CATHETER_TYPES.find(t => t.value === planCatheterType)?.label
    : 'Not configured — update Care Plan';
  const catheterSize = plan?.catheter_size_fr || null;

  const typeConfig = planCatheterType ? CATHETER_TYPE_CONFIG[planCatheterType] : null;

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

  // Calculate change countdown progress using plan-derived frequency
  const changeProgress = changeFrequencyDays && changeFrequencyDays > 0 && daysUntilChange !== null
    ? Math.max(0, Math.min(100, ((changeFrequencyDays - Math.max(0, daysUntilChange)) / changeFrequencyDays) * 100))
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
        {/* Catheter Type - from Care Plan */}
        <div className="text-sm text-muted-foreground">
          <strong>Type:</strong> {catheterTypeLabel}
          {catheterSize && ` • ${catheterSize}`}
        </div>

        {/* Change Interval - from Care Plan */}
        {plan?.change_interval && (
          <div className="text-sm text-muted-foreground">
            <strong>Change Interval:</strong> {plan.change_interval}
          </div>
        )}

        {/* Flush Interval - from Care Plan */}
        {plan?.flush_prescribed && plan?.flush_frequency && (
          <div className="text-sm text-muted-foreground">
            <strong>Flush Interval:</strong>{' '}
            {plan.flush_frequency === 'daily' ? 'Daily' :
             plan.flush_frequency === 'twice_daily' ? 'Twice Daily' :
             plan.flush_frequency === 'prn' ? 'PRN (As Needed)' :
             plan.flush_frequency.toLowerCase().includes('custom') && plan.flush_custom_interval
               ? `${plan.flush_custom_interval}${plan.flush_frequency.toLowerCase().includes('prn') ? ' + PRN' : ''}`
               : plan.flush_frequency}
          </div>
        )}

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
                <div className={`text-2xl font-bold ${isChangeOverdue ? 'text-destructive' : ''}`}>
                  {isChangeOverdue ? `${Math.abs(daysUntilChange)} days overdue` : `${daysUntilChange} days`}
                </div>
                <Progress value={changeProgress} className="h-2" />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Not scheduled</div>
            )}
          </div>

          {/* Flush Status - from Care Plan */}
          {plan?.flush_prescribed && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Droplets className="h-4 w-4" />
                Next Flush
              </div>
              {daysUntilFlush !== null ? (
                <div className={`text-2xl font-bold ${isFlushOverdue ? 'text-destructive' : ''}`}>
                  {isFlushOverdue ? `${Math.abs(daysUntilFlush)} days overdue` : `${daysUntilFlush} days`}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No flushes logged</div>
              )}
            </div>
          )}

          {/* Stoma Status - from Care Plan catheter type */}
          {typeConfig?.enableStomaChecks && (
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
          {monthlyBagUsage > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Bags This Month
              </div>
              <div className="text-2xl font-bold">{monthlyBagUsage}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onLogChange} className="w-full md:w-auto">
            Log Catheter Change
          </Button>
          {onLogFlush && (
            <Button variant="outline" onClick={onLogFlush} className="w-full md:w-auto gap-2">
              <Droplets className="h-4 w-4" />
              Log Catheter Flush
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
