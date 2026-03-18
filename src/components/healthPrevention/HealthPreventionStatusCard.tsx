/**
 * HealthPreventionStatusCard - Uses shared TrafficLightStatusCard
 * Health Prevention only uses green or amber — clamps any 'action' to 'monitor'.
 */

import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';
import { Shield, Calendar } from 'lucide-react';

interface HealthPreventionStatusCardProps {
  status: 'stable' | 'monitor' | 'action';
  dueCount: number;
  reminderText: string;
}

function getStatusMessage(status: 'stable' | 'monitor', dueCount: number): string {
  if (status === 'stable' && dueCount === 0) {
    return 'All preventive health items are up to date.';
  }
  if (dueCount === 1) {
    return '1 preventive health action pending';
  }
  return `${dueCount} preventive health actions pending`;
}

function getGuidance(status: 'stable' | 'monitor', dueCount: number): string {
  if (status === 'stable') {
    return 'Continue regular preventive health monitoring. Review screening and vaccination schedules at the next GP visit.';
  }
  return 'Review pending items below and discuss with the GP at the next appointment. Ensure all eligible screenings and vaccinations are scheduled.';
}

export function HealthPreventionStatusCard({
  status: rawStatus,
  dueCount,
  reminderText,
}: HealthPreventionStatusCardProps) {
  // Health Prevention only uses green or amber — clamp any 'action' to 'monitor'
  const status = rawStatus === 'action' ? 'monitor' : rawStatus;
  const trafficLight = toTrafficLight(status);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={getStatusMessage(status, dueCount)}
    >
      {/* Module-specific details */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 opacity-70" />
          <span>
            <span className="font-semibold">{dueCount}</span>
            <span className="opacity-70"> item{dueCount !== 1 ? 's' : ''} pending</span>
          </span>
        </div>
        {dueCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 opacity-70" />
            <span className="opacity-70">{reminderText}</span>
          </div>
        )}
      </div>

      {/* Guidance */}
      <div className="mt-3 pt-3 border-t border-current/10">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">{getGuidance(status, dueCount)}</p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Screening eligibility and vaccination schedules are based on Australian national guidelines.
      </p>
    </TrafficLightStatusCard>
  );
}
