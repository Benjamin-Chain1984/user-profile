/**
 * HealthMonitoringStatusCard - Traffic light status display for vital signs
 * Uses computeHealthMonitoringStatus for authoritative, config-driven overdue detection.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Thermometer, Wind, Timer, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useVitalSignEntries, useVitalSignAlerts, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeHealthMonitoringStatus } from '@/utils/computeHealthMonitoringStatus';
import { getStatusColor, getStatusLabel } from '@/utils/vitalSignStatusCalculator';
import type { VitalSignConfig } from '@/types/healthMonitoring';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HealthMonitoringStatusCardProps {
  clientId?: string;
}

export function HealthMonitoringStatusCard({ clientId }: HealthMonitoringStatusCardProps) {
  const { entries } = useVitalSignEntries(clientId, 50);
  const { alerts } = useVitalSignAlerts(clientId);
  const { criteriaMap } = useAlteredCriteria(clientId);

  // Always fetch raw config — never use DEFAULT_CONFIG fallback
  const { data: config } = useQuery({
    queryKey: ['vitalSignConfig', clientId, 'raw'],
    queryFn: async () => {
      let query = supabase.from('vital_sign_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as VitalSignConfig | null;
    },
  });

  const computed = computeHealthMonitoringStatus({
    config: config ?? null,
    entries,
    alerts,
    alteredCriteriaMap: criteriaMap,
  });

  const getOverallStatusColor = () => {
    switch (computed.moduleStatus) {
      case 'red': return 'border-red-500 bg-red-50';
      case 'amber': return 'border-amber-500 bg-amber-50';
      case 'ideal': return 'border-green-500 bg-green-50';
      default: return '';
    }
  };

  const getOverallStatusIcon = () => {
    switch (computed.moduleStatus) {
      case 'red': return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'amber': return <AlertCircle className="h-6 w-6 text-amber-600" />;
      case 'ideal': return <Activity className="h-6 w-6 text-green-600" />;
      default: return <Activity className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const vitalIcons: Record<string, React.ReactNode> = {
    temperature: <Thermometer className="h-3 w-3" />,
    bp: <Heart className="h-3 w-3" />,
    oxygen: <Wind className="h-3 w-3" />,
    heart_rate: <Activity className="h-3 w-3" />,
    respiratory: <Wind className="h-3 w-3" />,
  };

  const enabledVitals = computed.perVitalStatuses.filter(v => v.enabled);

  return (
    <Card className={cn('border-2', getOverallStatusColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getOverallStatusIcon()}
            Current Status
          </CardTitle>
          <Badge className={cn('text-sm', getStatusColor(computed.moduleStatus))}>
            {getStatusLabel(computed.moduleStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{computed.message}</p>

        {/* Config missing warning */}
        {computed.configMissing && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Configuration required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Health monitoring settings must be configured in Settings before overdue detection can run.
              </p>
            </div>
          </div>
        )}

        {/* Overdue observations banner */}
        {computed.overdueVitals.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Scheduled observations overdue</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {computed.overdueVitals.join(' · ')}
              </p>
            </div>
          </div>
        )}

        {computed.latestEntry && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
            <Timer className="h-3 w-3" />
            Last recorded{' '}
            {formatDistanceToNow(new Date(computed.latestEntry.event_occurred_at), { addSuffix: true })}
          </div>
        )}

        {/* Per-vital status grid with overdue details */}
        {enabledVitals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {enabledVitals.map((vital) => (
              <div
                key={String(vital.vitalKey)}
                className={cn(
                  'p-2 rounded border text-center',
                  vital.statusColor === 'red' && 'border-red-300 bg-red-50',
                  vital.statusColor === 'amber' && 'border-amber-300 bg-amber-50',
                  vital.statusColor === 'ideal' && 'border-green-300 bg-green-50',
                  !vital.statusColor && 'border-border bg-muted/50'
                )}
              >
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  {vitalIcons[String(vital.vitalKey)]}
                  {vital.label}
                </div>
                {vital.overdue ? (
                  <div className="text-xs font-medium text-amber-700 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Overdue
                    {vital.elapsedHours != null && vital.expectedIntervalHours != null && (
                      <span className="text-amber-600">
                        {' '}+{vital.elapsedHours - vital.expectedIntervalHours}h
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    'font-mono font-medium text-sm',
                    vital.statusColor === 'red' && 'text-red-700',
                    vital.statusColor === 'amber' && 'text-amber-700',
                    vital.statusColor === 'ideal' && 'text-green-700',
                    !vital.statusColor && 'text-muted-foreground'
                  )}>
                    {vital.lastRecordedAt ? (
                      <span className="flex items-center justify-center gap-1 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        On schedule
                      </span>
                    ) : '—'}
                  </div>
                )}
                {vital.lastRecordedAt && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(vital.lastRecordedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!computed.latestEntry && !computed.configMissing && (
          <p className="text-sm text-muted-foreground italic">
            No vital signs recorded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
