/**
 * Weight & BMI Status Card - Uses shared TrafficLightStatusCard
 */

import { useWeightBmiStatus } from '@/hooks/useWeightBmi';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';
import { BMI_CATEGORY_CONFIG } from '@/types/weightBmi';
import { Scale, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface WeightBmiStatusCardProps {
  clientId?: string;
}

export function WeightBmiStatusCard({ clientId }: WeightBmiStatusCardProps) {
  const statusInfo = useWeightBmiStatus(clientId);

  if (!statusInfo) {
    return (
      <div className="rounded-xl border-2 p-6 bg-muted/50 text-center text-muted-foreground">
        Loading weight status...
      </div>
    );
  }

  const trafficLight = toTrafficLight(statusInfo.status);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusInfo.message}
      lastUpdated={statusInfo.lastRecordedDate}
    >
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Current Weight</p>
          <p className="text-xl font-bold">
            {statusInfo.currentWeight ? `${statusInfo.currentWeight} kg` : '—'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">BMI</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold">
              {statusInfo.bmiValue ? statusInfo.bmiValue.toFixed(1) : '—'}
            </p>
            {statusInfo.bmiCategory && (
              <span className={`text-xs font-medium ${BMI_CATEGORY_CONFIG[statusInfo.bmiCategory].color}`}>
                {BMI_CATEGORY_CONFIG[statusInfo.bmiCategory].label}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Last Recorded
          </p>
          <p className="text-sm font-medium">
            {statusInfo.lastRecordedDate
              ? format(parseISO(statusInfo.lastRecordedDate), 'dd MMM yyyy')
              : 'Never'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Next Due
          </p>
          <p className={`text-sm font-medium ${statusInfo.isOverdue ? 'text-destructive' : ''}`}>
            {statusInfo.nextDueDate
              ? statusInfo.isOverdue
                ? 'Overdue'
                : format(parseISO(statusInfo.nextDueDate), 'dd MMM yyyy')
              : '—'}
          </p>
        </div>
      </div>

      {/* Active Alerts */}
      {statusInfo.activeAlerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Active Alerts
          </p>
          {statusInfo.activeAlerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`text-xs p-2 rounded ${
                alert.severity === 'red' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </TrafficLightStatusCard>
  );
}
