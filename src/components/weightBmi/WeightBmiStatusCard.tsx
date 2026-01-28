/**
 * Weight & BMI Status Card - Displays current status with IDEAL/Amber/Red indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useWeightBmiStatus } from '@/hooks/useWeightBmi';
import { BMI_CATEGORY_CONFIG } from '@/types/weightBmi';
import { format, parseISO } from 'date-fns';

interface WeightBmiStatusCardProps {
  clientId?: string;
}

export function WeightBmiStatusCard({ clientId }: WeightBmiStatusCardProps) {
  const statusInfo = useWeightBmiStatus(clientId);

  if (!statusInfo) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading weight status...
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    stable: 'bg-green-100 border-green-300 text-green-800',
    monitor: 'bg-amber-100 border-amber-300 text-amber-800',
    action: 'bg-red-100 border-red-300 text-red-800'
  };

  const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    stable: 'default',
    monitor: 'secondary',
    action: 'destructive'
  };

  return (
    <Card className={`border-2 ${statusColors[statusInfo.status]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight & BMI Status
          </CardTitle>
          <Badge variant={statusBadgeVariants[statusInfo.status]}>
            {statusInfo.statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        <p className="text-sm font-medium">{statusInfo.message}</p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Weight */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Weight</p>
            <p className="text-xl font-bold">
              {statusInfo.currentWeight ? `${statusInfo.currentWeight} kg` : '—'}
            </p>
          </div>

          {/* BMI */}
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

          {/* Last Recorded */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last Recorded
            </p>
            <p className="text-sm font-medium">
              {statusInfo.lastRecordedDate 
                ? format(parseISO(statusInfo.lastRecordedDate), 'dd MMM yyyy')
                : 'Never'
              }
            </p>
          </div>

          {/* Next Due */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Next Due
            </p>
            <p className={`text-sm font-medium ${statusInfo.isOverdue ? 'text-red-600' : ''}`}>
              {statusInfo.nextDueDate 
                ? statusInfo.isOverdue 
                  ? 'Overdue'
                  : format(parseISO(statusInfo.nextDueDate), 'dd MMM yyyy')
                : '—'
              }
            </p>
          </div>
        </div>

        {/* Active Alerts */}
        {statusInfo.activeAlerts.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Active Alerts
            </p>
            {statusInfo.activeAlerts.slice(0, 3).map(alert => (
              <div 
                key={alert.id}
                className={`text-xs p-2 rounded ${
                  alert.severity === 'red' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
