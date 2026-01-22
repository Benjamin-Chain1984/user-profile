/**
 * Bowel Care Status Card - Current status overview
 */

import { cn } from '@/lib/utils';
import { useBowelCareStatus } from '@/hooks/useBowelCare';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { BowelCareStatus } from '@/types/bowelCare';
import { StoolIllustration } from './StoolIllustration';

interface BowelCareStatusCardProps {
  clientId: string;
}

const statusConfig: Record<BowelCareStatus, { label: string; icon: React.ElementType; className: string }> = {
  ideal: {
    label: 'IDEAL',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  monitor: {
    label: 'Monitor',
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  action: {
    label: 'Action Needed',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
};

export function BowelCareStatusCard({ clientId }: BowelCareStatusCardProps) {
  const statusInfo = useBowelCareStatus(clientId);
  const config = statusConfig[statusInfo.status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border-2 p-6 transition-all',
      config.className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-3 rounded-full',
            statusInfo.status === 'ideal' && 'bg-green-200',
            statusInfo.status === 'monitor' && 'bg-amber-200',
            statusInfo.status === 'action' && 'bg-red-200',
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{config.label}</h3>
              {statusInfo.status === 'ideal' && (
                <span className="text-2xl">🟢</span>
              )}
              {statusInfo.status === 'monitor' && (
                <span className="text-2xl">🟡</span>
              )}
              {statusInfo.status === 'action' && (
                <span className="text-2xl">🔴</span>
              )}
            </div>
            <p className="text-sm opacity-80">{statusInfo.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {statusInfo.lastBristolType !== null && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-10 rounded-lg bg-white/50 p-1 flex items-center justify-center">
                <StoolIllustration type={statusInfo.lastBristolType} />
              </div>
              <span className="text-xs opacity-70">Last: Type {statusInfo.lastBristolType}</span>
            </div>
          )}
          <div className="text-right">
            {statusInfo.daysSinceLastBm !== null && (
              <div className="text-sm">
                <span className="font-semibold">{statusInfo.daysSinceLastBm}</span>
                <span className="opacity-70"> {statusInfo.daysSinceLastBm === 1 ? 'day' : 'days'} since last BM</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {statusInfo.activeAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="text-sm font-medium mb-2">
            Active Alerts ({statusInfo.activeAlerts.length})
          </div>
          <ul className="space-y-1">
            {statusInfo.activeAlerts.slice(0, 3).map((alert) => (
              <li key={alert.id} className="text-sm opacity-80">
                • {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance */}
      <div className="mt-4 pt-4 border-t border-current/20">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {statusInfo.status === 'ideal' && 'Continue regular monitoring. Encourage hydration and fibre intake.'}
          {statusInfo.status === 'monitor' && 'Monitor closely. Consider preventative measures like increased fluids.'}
          {statusInfo.status === 'action' && 'Review PRN laxative options. Follow the person\'s health plan and escalate if concerned.'}
        </p>
      </div>

      <p className="mt-4 text-xs opacity-60 italic">
        Thresholds and PRN use should be defined by a GP or health practitioner.
      </p>
    </div>
  );
}
