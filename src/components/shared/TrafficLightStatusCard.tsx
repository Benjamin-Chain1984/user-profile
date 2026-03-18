/**
 * TrafficLightStatusCard — Universal module status header card.
 * Every module MUST render this at the top of its dashboard.
 */

import { cn } from '@/lib/utils';
import { TrafficLightBadge } from './TrafficLightBadge';
import { TrafficLightIcon } from './TrafficLightIcon';
import type { TrafficLightStatus } from '@/types/trafficLight';
import { getTrafficLightFullLabel } from '@/types/trafficLight';
import { formatDistanceToNow } from 'date-fns';

interface TrafficLightStatusCardProps {
  status: TrafficLightStatus;
  reason: string;
  lastUpdated?: string | null;
  children?: React.ReactNode;
  className?: string;
}

const containerStyles: Record<TrafficLightStatus, string> = {
  green: 'bg-success/10 border-success/30',
  amber: 'bg-warning/10 border-warning/30',
  red: 'bg-destructive/10 border-destructive/30',
};

export function TrafficLightStatusCard({
  status,
  reason,
  lastUpdated,
  children,
  className,
}: TrafficLightStatusCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 sm:p-6 transition-all',
        containerStyles[status],
        className
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Traffic light icon */}
        <TrafficLightIcon status={status} size="md" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold leading-tight">
              {getTrafficLightFullLabel(status)}
            </h3>
          </div>
          <p className="text-sm opacity-80 mt-1">{reason}</p>
          {lastUpdated && (
            <p className="text-xs opacity-60 mt-1.5">
              Last updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Badge */}
        <div className="shrink-0">
          <TrafficLightBadge status={status} size="md" />
        </div>
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-current/10">
          {children}
        </div>
      )}
    </div>
  );
}
