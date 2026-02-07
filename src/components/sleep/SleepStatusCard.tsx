/**
 * Sleep Status Card - Current sleep status overview
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { useSleepStatus } from '@/hooks/useSleep';
import { Moon, Clock, AlertCircle } from 'lucide-react';

interface SleepStatusCardProps {
  clientId?: string;
}

export function SleepStatusCard({ clientId }: SleepStatusCardProps) {
  const statusInfo = useSleepStatus(clientId);

  const statusMap = {
    ideal: 'stable' as const,
    monitor: 'monitor' as const,
    action: 'action' as const,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            Sleep Status
          </CardTitle>
          <StatusBadge status={statusMap[statusInfo.status]} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{statusInfo.message}</p>
      </CardContent>
    </Card>
  );
}
