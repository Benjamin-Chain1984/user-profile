/**
 * Catheter Traffic Light Status Card - Uses shared TrafficLightStatusCard
 * Mirrors the Bowel Care pattern exactly.
 */

import { useCatheterStatus } from '@/hooks/useCatheter';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';
import { Clock, Droplets, Activity } from 'lucide-react';

interface CatheterTrafficLightCardProps {
  clientId?: string;
}

function getStatusReason(
  status: 'stable' | 'monitor' | 'action',
  isChangeOverdue: boolean,
  isFlushOverdue: boolean,
  stomaAlertActive: boolean,
  daysUntilChange: number | null,
  daysUntilFlush: number | null,
): string {
  if (status === 'action') {
    const reasons: string[] = [];
    if (isChangeOverdue) reasons.push('Catheter change is overdue');
    if (isFlushOverdue) reasons.push('Catheter flush is overdue');
    if (stomaAlertActive) reasons.push('Stoma check flagged a concern');
    return reasons.join('. ') || 'Action required';
  }
  if (status === 'monitor') {
    if (daysUntilChange !== null && daysUntilChange <= 3)
      return `Catheter change due in ${daysUntilChange} day${daysUntilChange === 1 ? '' : 's'}`;
    if (daysUntilFlush !== null && daysUntilFlush <= 1)
      return 'Catheter flush due soon';
    return 'Monitoring recommended';
  }
  return 'All catheter care is on track';
}

function getGuidance(status: 'stable' | 'monitor' | 'action'): string {
  switch (status) {
    case 'stable':
      return 'Continue regular catheter care as per the care plan. Monitor urine output and appearance.';
    case 'monitor':
      return 'Prepare for upcoming catheter care tasks. Check supplies and review the care plan.';
    case 'action':
      return 'Review the care plan and complete overdue tasks. Escalate concerns to the responsible clinician.';
  }
}

export function CatheterTrafficLightCard({ clientId }: CatheterTrafficLightCardProps) {
  const {
    status,
    daysUntilChange,
    isChangeOverdue,
    daysUntilFlush,
    isFlushOverdue,
    stomaStatus,
    stomaAlertActive,
    activeAlerts,
    loading,
  } = useCatheterStatus(clientId);

  if (loading) return null;

  const trafficLight = toTrafficLight(status);
  const reason = getStatusReason(status, isChangeOverdue, isFlushOverdue, stomaAlertActive, daysUntilChange, daysUntilFlush);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={reason}
      lastUpdated={activeAlerts[0]?.created_at}
    >
      {/* Module-specific key metrics */}
      <div className="flex items-center gap-6 flex-wrap">
        {daysUntilChange !== null && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 opacity-70" />
            <span>
              <span className="font-semibold">
                {isChangeOverdue
                  ? `${Math.abs(daysUntilChange)}d overdue`
                  : `${daysUntilChange}d`}
              </span>
              <span className="opacity-70"> until change</span>
            </span>
          </div>
        )}
        {daysUntilFlush !== null && (
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 opacity-70" />
            <span>
              <span className="font-semibold">
                {isFlushOverdue
                  ? `${Math.abs(daysUntilFlush)}d overdue`
                  : `${daysUntilFlush}d`}
              </span>
              <span className="opacity-70"> until flush</span>
            </span>
          </div>
        )}
        {stomaAlertActive && (
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 opacity-70" />
            <span className="font-semibold">Stoma concern flagged</span>
          </div>
        )}
      </div>

      {activeAlerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="text-sm font-medium mb-2">
            Active Alerts ({activeAlerts.length})
          </div>
          <ul className="space-y-1">
            {activeAlerts.slice(0, 3).map((alert) => (
              <li key={alert.id} className="text-sm opacity-80">• {alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance */}
      <div className="mt-3 pt-3 border-t border-current/10">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">{getGuidance(status)}</p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Catheter type, change schedules, and flush protocols should be determined by a qualified health professional.
      </p>
    </TrafficLightStatusCard>
  );
}
