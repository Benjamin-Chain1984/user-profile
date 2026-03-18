/**
 * Sleep Status Card - Uses shared TrafficLightStatusCard
 */

import { useSleepStatus } from '@/hooks/useSleep';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface SleepStatusCardProps {
  clientId?: string;
}

export function SleepStatusCard({ clientId }: SleepStatusCardProps) {
  const statusInfo = useSleepStatus(clientId);
  const trafficLight = toTrafficLight(statusInfo.status);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusInfo.message}
    />
  );
}
