/**
 * Enteral Nutrition Traffic Light Status Card
 * Uses shared TrafficLightStatusCard — matches Bowel Care pattern.
 */

import { useMemo } from 'react';
import { useEnteralConfig, useEnteralFeedLogs, useEnteralFlushLogs, useEnteralStomaChecks, useEnteralMedicationLogs } from '@/hooks/useEnteral';
import { calculateEnteralStatus } from '@/utils/enteralStatusCalculator';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface Props {
  clientId?: string;
}

export function EnteralTrafficLightCard({ clientId }: Props) {
  const { data: config } = useEnteralConfig(clientId);
  const { data: feedLogs = [] } = useEnteralFeedLogs(clientId);
  const { data: flushLogs = [] } = useEnteralFlushLogs(clientId);
  const { data: stomaChecks = [] } = useEnteralStomaChecks(clientId);
  const { data: medLogs = [] } = useEnteralMedicationLogs(clientId);

  const statusResult = useMemo(() => calculateEnteralStatus({
    config: config || null,
    feedLogs,
    flushLogs,
    stomaChecks,
    medLogs,
  }), [config, feedLogs, flushLogs, stomaChecks, medLogs]);

  const trafficLight = toTrafficLight(statusResult.status);

  const lastUpdated = feedLogs[0]?.event_occurred_at || flushLogs[0]?.event_occurred_at || null;

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusResult.message}
      lastUpdated={lastUpdated}
    >
      {/* Guidance */}
      <div>
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {statusResult.status === 'stable' && 'Continue scheduled feeds and flushes. Monitor tube site and maintain hydration as per plan.'}
          {statusResult.status === 'monitor' && 'Check for missed feeds. Review tube change schedule and stoma site. Escalate any concerns to a nurse or dietitian.'}
          {statusResult.status === 'action' && 'Attend to overdue feeds or tube change immediately. Report stoma concerns to the clinical team. Seek medical advice.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Follow the person's Enteral Nutrition and Medication Plan. Seek medical advice if concerns arise.
      </p>
    </TrafficLightStatusCard>
  );
}
