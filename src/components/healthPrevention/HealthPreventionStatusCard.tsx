/**
 * HealthPreventionStatusCard - Status overview card for Health Prevention module
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, Clock, Circle } from 'lucide-react';

interface HealthPreventionStatusCardProps {
  status: 'stable' | 'monitor' | 'action';
  dueCount: number;
  reminderText: string;
}

export function HealthPreventionStatusCard({
  status: rawStatus,
  dueCount,
  reminderText,
}: HealthPreventionStatusCardProps) {
  // Health Prevention only uses green or amber — clamp any 'action' to 'monitor'
  const status = rawStatus === 'action' ? 'monitor' : rawStatus;

  const getStatusIcon = () => {
    switch (status) {
      case 'stable':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'monitor':
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusMessage = () => {
    if (status === 'stable' && dueCount === 0) {
      return 'All preventive health items are up to date.';
    }
    if (dueCount === 1) {
      return '1 preventive health action pending';
    }
    return `${dueCount} preventive health actions pending`;
  };

  return (
    <Card className={
      status === 'monitor' ? 'border-warning/50 bg-warning/5' :
      'border-success/50 bg-success/5'
    }>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>Preventive Health Status</span>
          </div>
          <Badge variant={status === 'stable' ? 'stable' : 'monitor'} className="gap-1.5 text-sm px-3 py-1">
            <Circle className="w-2 h-2 fill-current" />
            {status === 'stable' ? 'Up to date' : 'AMBER'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium">{getStatusMessage()}</p>
            {dueCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {reminderText}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
