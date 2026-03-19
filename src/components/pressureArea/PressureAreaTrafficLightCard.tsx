/**
 * Pressure Area Prevention Traffic Light Status Card
 * Uses shared TrafficLightStatusCard — matches Bowel Care pattern.
 */

import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan, usePressureReliefPlanAcknowledgements } from '@/hooks/usePressureReliefPlan';
import { calculatePressureAreaStatus } from '@/utils/pressureAreaStatusCalculator';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface Props {
  clientId?: string;
}

export function PressureAreaTrafficLightCard({ clientId }: Props) {
  const { plan } = usePressureReliefPlan(clientId);
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const { config } = usePressureAreaConfig(clientId);
  const { hasCurrentUserAcknowledged } = usePressureReliefPlanAcknowledgements(plan?.id, plan?.version);

  const statusInfo = calculatePressureAreaStatus({
    plan,
    events,
    skinChecks: sessions,
    config: config ? {
      skin_check_frequency_days: config.skin_check_frequency_days,
      enable_compliance_scoring: config.enable_compliance_scoring,
      skin_checks_per_day: config.skin_checks_per_day,
      skin_check_times: config.skin_check_times,
    } : null,
    planAcknowledged: hasCurrentUserAcknowledged,
  });

  const trafficLight = toTrafficLight(statusInfo.status);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusInfo.message}
      lastUpdated={events[0]?.event_occurred_at || sessions[0]?.event_occurred_at}
    >
      {/* Guidance */}
      <div>
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {statusInfo.status === 'ideal' && 'Continue regular repositioning schedule and skin checks. Maintain good nutrition and hydration.'}
          {statusInfo.status === 'monitor' && 'Review repositioning schedule. Perform a skin check and escalate any new findings to a nurse or GP.'}
          {statusInfo.status === 'action' && 'Attend to overdue repositioning. Avoid pressure on affected areas. Seek advice from a nurse, GP, or health professional.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Pressure relief schedules and skin assessments should be determined by a qualified health professional.
      </p>
    </TrafficLightStatusCard>
  );
}
