/**
 * HealthMonitoringStatusCard - Traffic light status display for vital signs
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Thermometer, Wind, Timer, AlertCircle, Clock } from 'lucide-react';
import { useHealthMonitoringStatus, useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { VITAL_THRESHOLDS, type VitalType } from '@/types/healthMonitoring';
import { getStatusColor, getStatusLabel } from '@/utils/vitalSignStatusCalculator';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HealthMonitoringStatusCardProps {
  clientId?: string;
}

const VITAL_ICONS: Record<VitalType, React.ReactNode> = {
  temperature: <Thermometer className="h-4 w-4" />,
  bp_systolic: <Heart className="h-4 w-4" />,
  bp_diastolic: <Heart className="h-4 w-4" />,
  oxygen: <Wind className="h-4 w-4" />,
  heart_rate: <Activity className="h-4 w-4" />,
  respiratory: <Wind className="h-4 w-4" />,
};

export function HealthMonitoringStatusCard({ clientId }: HealthMonitoringStatusCardProps) {
  const statusInfo = useHealthMonitoringStatus(clientId);
  const { config } = useVitalSignConfig(clientId);

  const getOverallStatusColor = () => {
    switch (statusInfo.status) {
      case 'red':
        return 'border-red-500 bg-red-50';
      case 'amber':
        return 'border-amber-500 bg-amber-50';
      case 'ideal':
        return 'border-green-500 bg-green-50';
      default:
        return '';
    }
  };

  const getOverallStatusIcon = () => {
    switch (statusInfo.status) {
      case 'red':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'amber':
        return <AlertCircle className="h-6 w-6 text-amber-600" />;
      case 'ideal':
        return <Activity className="h-6 w-6 text-green-600" />;
      default:
        return <Activity className="h-6 w-6 text-muted-foreground" />;
    }
  };

  // Get enabled vitals
  const enabledVitals: { type: VitalType; label: string; value: string | null; status: string | null }[] = [];

  if (config.temperature_enabled && statusInfo.latestEntry) {
    enabledVitals.push({
      type: 'temperature',
      label: 'Temperature',
      value: statusInfo.latestEntry.temperature_celsius 
        ? `${statusInfo.latestEntry.temperature_celsius}°C` 
        : null,
      status: statusInfo.vitalStatuses.temperature,
    });
  }

  if (config.bp_enabled && statusInfo.latestEntry) {
    const sys = statusInfo.latestEntry.bp_systolic;
    const dia = statusInfo.latestEntry.bp_diastolic;
    enabledVitals.push({
      type: 'bp_systolic',
      label: 'Blood Pressure',
      value: sys && dia ? `${sys}/${dia} mmHg` : null,
      status: statusInfo.vitalStatuses.bp_systolic,
    });
  }

  if (config.oxygen_enabled && statusInfo.latestEntry) {
    enabledVitals.push({
      type: 'oxygen',
      label: 'SpO₂',
      value: statusInfo.latestEntry.oxygen_saturation 
        ? `${statusInfo.latestEntry.oxygen_saturation}%` 
        : null,
      status: statusInfo.vitalStatuses.oxygen,
    });
  }

  if (config.heart_rate_enabled && statusInfo.latestEntry) {
    enabledVitals.push({
      type: 'heart_rate',
      label: 'Heart Rate',
      value: statusInfo.latestEntry.heart_rate 
        ? `${statusInfo.latestEntry.heart_rate} bpm` 
        : null,
      status: statusInfo.vitalStatuses.heart_rate,
    });
  }

  if (config.respiratory_enabled && statusInfo.latestEntry) {
    enabledVitals.push({
      type: 'respiratory',
      label: 'Respiratory',
      value: statusInfo.latestEntry.respiratory_rate 
        ? `${statusInfo.latestEntry.respiratory_rate}/min` 
        : null,
      status: statusInfo.vitalStatuses.respiratory,
    });
  }

  return (
    <Card className={cn('border-2', getOverallStatusColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getOverallStatusIcon()}
            Current Status
          </CardTitle>
          <Badge className={cn('text-sm', getStatusColor(statusInfo.status))}>
            {getStatusLabel(statusInfo.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{statusInfo.message}</p>

        {/* Overdue observations banner */}
        {statusInfo.overdueVitals.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Scheduled observations overdue</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {statusInfo.overdueVitals.join(' · ')}
              </p>
            </div>
          </div>
        )}

        {statusInfo.latestEntry && (
          <>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
              <Timer className="h-3 w-3" />
              Last recorded{' '}
              {formatDistanceToNow(new Date(statusInfo.latestEntry.event_occurred_at), {
                addSuffix: true,
              })}
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {enabledVitals.map((vital) => (
                <div
                  key={vital.type}
                  className={cn(
                    'p-2 rounded border text-center',
                    vital.status === 'red' && 'border-red-300 bg-red-50',
                    vital.status === 'amber' && 'border-amber-300 bg-amber-50',
                    vital.status === 'ideal' && 'border-green-300 bg-green-50',
                    !vital.status && 'border-border bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    {VITAL_ICONS[vital.type]}
                    {vital.label}
                  </div>
                  <div className={cn(
                    'font-mono font-medium',
                    vital.status === 'red' && 'text-red-700',
                    vital.status === 'amber' && 'text-amber-700',
                    vital.status === 'ideal' && 'text-green-700',
                    !vital.status && 'text-muted-foreground'
                  )}>
                    {vital.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!statusInfo.latestEntry && (
          <p className="text-sm text-muted-foreground italic">
            No vital signs recorded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
