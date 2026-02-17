/**
 * Pressure Area Prevention Status Card
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan, usePressureReliefPlanAcknowledgements } from '@/hooks/usePressureReliefPlan';
import { calculatePressureAreaStatus } from '@/utils/pressureAreaStatusCalculator';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function PressureAreaStatusCard({ clientId }: Props) {
  const { plan } = usePressureReliefPlan(clientId);
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const { config } = usePressureAreaConfig(clientId);
  const { hasCurrentUserAcknowledged } = usePressureReliefPlanAcknowledgements(plan?.id, plan?.version);

  const status = calculatePressureAreaStatus({
    plan: plan || null,
    events,
    skinChecks: sessions,
    config: config ? {
      skin_check_frequency_days: config.skin_check_frequency_days,
      enable_compliance_scoring: config.enable_compliance_scoring,
    } : null,
    planAcknowledged: hasCurrentUserAcknowledged,
  });

  const statusConfig = {
    ideal: { label: 'IDEAL', icon: CheckCircle2, color: 'bg-green-100 text-green-800', borderColor: 'border-green-200' },
    monitor: { label: 'Amber – Attention Required', icon: AlertTriangle, color: 'bg-amber-100 text-amber-800', borderColor: 'border-amber-200' },
    action: { label: 'Red – Action Needed', icon: AlertCircle, color: 'bg-red-100 text-red-800', borderColor: 'border-red-200' },
  };

  const cfg = statusConfig[status.status];
  const Icon = cfg.icon;

  return (
    <Card className={`${cfg.borderColor}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${status.status === 'ideal' ? 'text-green-600' : status.status === 'monitor' ? 'text-amber-600' : 'text-red-600'}`} />
            <div>
              <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
              <p className="text-sm mt-1">{status.message}</p>
            </div>
          </div>
          {status.compliancePercent !== undefined && (
            <div className="text-right">
              <p className="text-2xl font-bold">{status.compliancePercent}%</p>
              <p className="text-xs text-muted-foreground">Compliance</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
