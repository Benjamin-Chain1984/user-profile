/**
 * IDDSI Status Card - Uses shared TrafficLightStatusCard
 */

import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';
import { Clock } from 'lucide-react';

interface IddsiStatusCardProps {
  lastSeverity: string;
  lastObservationTime: string | null;
  countdown: string;
  isOverdue: boolean;
  enableObservations: boolean;
}

function severityToStatus(severity: string): string {
  switch (severity) {
    case 'red': return 'action';
    case 'amber': return 'monitor';
    case 'green':
    default: return 'stable';
  }
}

function getStatusMessage(severity: string, hasObservation: boolean): string {
  if (!hasObservation) return 'No mealtime observations recorded yet.';
  switch (severity) {
    case 'red': return 'Swallowing concern detected — follow escalation protocol.';
    case 'amber': return 'Mild concern observed — monitor closely at next meal.';
    case 'green':
    default: return 'No swallowing concerns detected. Continue safe mealtime practices.';
  }
}

export function IddsiStatusCard({
  lastSeverity,
  lastObservationTime,
  countdown,
  isOverdue,
  enableObservations,
}: IddsiStatusCardProps) {
  // If observation is overdue, escalate to at least amber
  const effectiveSeverity = isOverdue && lastSeverity === 'green' ? 'amber' : lastSeverity;
  const trafficLight = toTrafficLight(severityToStatus(effectiveSeverity));
  const hasObservation = !!lastObservationTime;

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={getStatusMessage(lastSeverity, hasObservation)}
      lastUpdated={lastObservationTime}
    >
      {/* Countdown timer */}
      {enableObservations && countdown && (
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
          <Clock className="h-3.5 w-3.5" />
          {isOverdue ? `⚠ ${countdown}` : `Next observation due in ${countdown}`}
        </div>
      )}

      {/* Guidance */}
      <div className="mt-3 pt-3 border-t border-current/10">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {lastSeverity === 'green' && 'Continue prescribed IDDSI levels. Ensure correct positioning before meals.'}
          {lastSeverity === 'amber' && 'Monitor for recurring signs. Review safe swallowing strategies. Escalate if two consecutive amber observations.'}
          {lastSeverity === 'red' && 'Stop the meal immediately. Follow the escalation protocol. Contact the Speech Pathologist or call 000 if choking.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Food and fluid levels must be prescribed by a qualified Speech Pathologist.
      </p>
    </TrafficLightStatusCard>
  );
}
