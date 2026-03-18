/**
 * Bowel Care Status Card - Uses shared TrafficLightStatusCard
 */

import { useBowelCareStatus } from '@/hooks/useBowelCare';
import { StoolIllustration } from './StoolIllustration';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface BowelCareStatusCardProps {
  clientId: string;
}

export function BowelCareStatusCard({ clientId }: BowelCareStatusCardProps) {
  const statusInfo = useBowelCareStatus(clientId);
  const trafficLight = toTrafficLight(statusInfo.status);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusInfo.message}
      lastUpdated={statusInfo.activeAlerts[0]?.created_at}
    >
      {/* Module-specific details */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {statusInfo.lastBristolType !== null && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-10 rounded-lg bg-background/50 p-1 flex items-center justify-center">
                <StoolIllustration type={statusInfo.lastBristolType} />
              </div>
              <span className="text-xs opacity-70">Last: Type {statusInfo.lastBristolType}</span>
            </div>
          )}
          {statusInfo.daysSinceLastBm !== null && (
            <div className="text-sm">
              <span className="font-semibold">{statusInfo.daysSinceLastBm}</span>
              <span className="opacity-70"> {statusInfo.daysSinceLastBm === 1 ? 'day' : 'days'} since last BM</span>
            </div>
          )}
        </div>
      </div>

      {statusInfo.activeAlerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="text-sm font-medium mb-2">
            Active Alerts ({statusInfo.activeAlerts.length})
          </div>
          <ul className="space-y-1">
            {statusInfo.activeAlerts.slice(0, 3).map((alert) => (
              <li key={alert.id} className="text-sm opacity-80">• {alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance */}
      <div className="mt-3 pt-3 border-t border-current/10">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {statusInfo.status === 'ideal' && 'Continue regular monitoring. Encourage hydration and fibre intake.'}
          {statusInfo.status === 'monitor' && 'Monitor closely. Consider preventative measures like increased fluids.'}
          {statusInfo.status === 'action' && 'Review PRN laxative options. Follow the person\'s health plan and escalate if concerned.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Thresholds and PRN use should be defined by a GP or health practitioner.
      </p>
    </TrafficLightStatusCard>
  );
}
