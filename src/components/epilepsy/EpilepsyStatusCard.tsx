/**
 * Epilepsy Status Card - Current status overview
 */

import { cn } from '@/lib/utils';
import { useEpilepsyStatus } from '@/hooks/useEpilepsy';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { EpilepsyStatus } from '@/types/epilepsy';

interface EpilepsyStatusCardProps {
  clientId?: string;
}

const statusConfig: Record<EpilepsyStatus, { label: string; icon: React.ElementType; className: string }> = {
  ideal: {
    label: 'IDEAL',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/30',
  },
  monitor: {
    label: 'Amber – Attention Required',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  action: {
    label: 'Red – Action Needed',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

export function EpilepsyStatusCard({ clientId }: EpilepsyStatusCardProps) {
  const statusInfo = useEpilepsyStatus(clientId);
  const config = statusConfig[statusInfo.status];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border-2 p-6 transition-all', config.className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-3 rounded-full',
            statusInfo.status === 'ideal' && 'bg-success/20',
            statusInfo.status === 'monitor' && 'bg-warning/20',
            statusInfo.status === 'action' && 'bg-destructive/20',
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{config.label}</h3>
              {statusInfo.status === 'ideal' && <span className="text-2xl">🟢</span>}
              {statusInfo.status === 'monitor' && <span className="text-2xl">🟡</span>}
              {statusInfo.status === 'action' && <span className="text-2xl">🔴</span>}
            </div>
            <p className="text-sm opacity-80">{statusInfo.message}</p>
          </div>
        </div>
        <div className="text-right">
          {statusInfo.daysSinceLastSeizure !== null && (
            <div>
              <span className="text-3xl font-bold">{statusInfo.daysSinceLastSeizure}</span>
              <p className="text-xs opacity-70">
                {statusInfo.daysSinceLastSeizure === 1 ? 'day' : 'days'} since last seizure
              </p>
            </div>
          )}
        </div>
      </div>

      {statusInfo.activeAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="text-sm font-medium mb-2">Active Alerts ({statusInfo.activeAlerts.length})</div>
          <ul className="space-y-1">
            {statusInfo.activeAlerts.slice(0, 3).map((alert) => (
              <li key={alert.id} className="text-sm opacity-80">• {alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-current/20">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {statusInfo.status === 'ideal' && 'Continue regular monitoring. Ensure medication compliance.'}
          {statusInfo.status === 'monitor' && 'Increase monitoring frequency. Review triggers and medication compliance. Consider GP/neurologist review.'}
          {statusInfo.status === 'action' && 'Follow Epilepsy Management Plan. Administer rescue medication if prescribed. Call 000 if indicated.'}
        </p>
      </div>
    </div>
  );
}
