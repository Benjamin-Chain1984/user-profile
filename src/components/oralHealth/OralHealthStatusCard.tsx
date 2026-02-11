/**
 * Oral Health Status Card
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useOralHealthAssessments, useOralHealthTaskLogs, useOralHealthConfig } from '@/hooks/useOralHealth';
import { calculateOralHealthStatus } from '@/utils/oralHealthStatusCalculator';

interface Props {
  clientId?: string;
}

export function OralHealthStatusCard({ clientId }: Props) {
  const { assessments } = useOralHealthAssessments(clientId);
  const { logs } = useOralHealthTaskLogs(clientId);
  const { config } = useOralHealthConfig(clientId);

  const statusInfo = calculateOralHealthStatus({
    assessments,
    taskLogs: logs,
    config,
  });

  const statusConfig = {
    ideal: { label: 'IDEAL', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
    monitor: { label: 'Amber – Attention Required', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    action: { label: 'Red – Action Needed', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  };

  const s = statusConfig[statusInfo.status];
  const Icon = s.icon;

  return (
    <Card className={`${s.border} border`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Smile className="h-5 w-5" />
          Oral Health Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${s.bg}`}>
            <Icon className={`h-5 w-5 ${s.color}`} />
          </div>
          <div className="flex-1">
            <Badge variant="outline" className={`${s.color} mb-1`}>{s.label}</Badge>
            <p className="text-sm text-muted-foreground mt-1">{statusInfo.message}</p>
            {statusInfo.compliancePercent !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Weekly compliance: {statusInfo.compliancePercent}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
