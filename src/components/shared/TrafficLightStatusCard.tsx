/**
 * TrafficLightStatusCard — Universal module status header card.
 * Every module MUST render this at the top of its dashboard.
 * 
 * Shows:
 * - Large traffic light indicator
 * - Status label (IDEAL / Amber / Red)
 * - One-line reason text
 * - Last updated timestamp
 */

import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { TrafficLightBadge } from './TrafficLightBadge';
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

const statusStyles: Record<TrafficLightStatus, {
  icon: React.ElementType;
  containerClass: string;
  iconContainerClass: string;
  emoji: string;
}> = {
  green: {
    icon: CheckCircle,
    containerClass: 'bg-success/10 border-success/30',
    iconContainerClass: 'bg-success/20',
    emoji: '🟢',
  },
  amber: {
    icon: AlertTriangle,
    containerClass: 'bg-warning/10 border-warning/30',
    iconContainerClass: 'bg-warning/20',
    emoji: '🟠',
  },
  red: {
    icon: AlertCircle,
    containerClass: 'bg-destructive/10 border-destructive/30',
    iconContainerClass: 'bg-destructive/20',
    emoji: '🔴',
  },
};

export function TrafficLightStatusCard({
  status,
  reason,
  lastUpdated,
  children,
  className,
}: TrafficLightStatusCardProps) {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 sm:p-6 transition-all',
        config.containerClass,
        className
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className={cn('p-3 rounded-full shrink-0', config.iconContainerClass)}>
          <Icon className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold leading-tight">
              {getTrafficLightFullLabel(status)}
            </h3>
            <span className="text-xl leading-none">{config.emoji}</span>
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

      {/* Optional children (module-specific details) */}
      {children && (
        <div className="mt-4 pt-4 border-t border-current/10">
          {children}
        </div>
      )}
    </div>
  );
}
